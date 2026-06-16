import { useEffect, useCallback, useState } from 'react';
import * as turf from '@turf/turf';
import { useCatalogContext } from '../../context/CatalogContext';
import { useMapContext } from '../../context/MapContext';
import { t } from '../../i18n';

const POLYGON_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Orange
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#14B8A6', // Teal
];

export function usePolygonHandlers() {
  const { mapRef, shouldInitializeFeatures, drawRef } = useMapContext();
  const map = mapRef.current;
  const { polygons, setPolygons } = useCatalogContext();
  const [drawReadyTick, setDrawReadyTick] = useState(0);

  const syncPolygonsFromDraw = useCallback(() => {
    const mapInstance = mapRef.current;
    if (!mapInstance || !drawRef.current) return;

    const existingById = new Map(polygons.map(polygon => [String(polygon.id), polygon]));
    const isPolygonFeature = (
      feature: GeoJSON.Feature,
    ): feature is GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> =>
      feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon';

    const nextPolygons = drawRef.current
      .getAll()
      .features.filter(isPolygonFeature)
      .map(feature => {
        if (!feature.properties) feature.properties = {};
        feature.properties.shape = feature.properties.shape ? feature.properties.shape : 'polygon';

        const existingPolygon = existingById.get(String(feature.id));

        let color = existingPolygon?.color || (feature.properties.user_color as string);
        let name = existingPolygon?.name || (feature.properties.user_name as string);
        const isLocked = existingPolygon?.isLocked ?? false;

        if (!color) {
          const usedColors = new Set(polygons.map(p => p.color).filter(Boolean));
          color = POLYGON_COLORS.find(c => !usedColors.has(c)) || POLYGON_COLORS[polygons.length % POLYGON_COLORS.length];
          feature.properties.user_color = color;
          try {
            drawRef.current.setFeatureProperty(String(feature.id), 'user_color', color);
          } catch (e) {
            console.error('Error setting user_color on draw feature:', e);
          }
        } else {
          feature.properties.user_color = color;
        }

        if (!name) {
          const prefix = t('area');
          const usedNames = new Set(polygons.map(p => p.name).filter(Boolean));
          let num = 1;
          while (usedNames.has(`${prefix} ${num}`)) {
            num++;
          }
          name = `${prefix} ${num}`;
          feature.properties.user_name = name;
          try {
            drawRef.current.setFeatureProperty(String(feature.id), 'user_name', name);
          } catch (e) {
            console.error('Error setting user_name on draw feature:', e);
          }
        } else {
          feature.properties.user_name = name;
        }

        const getCenter = (geojson: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>) => {
          if (geojson.geometry.type === 'Polygon') {
            return turf.centerOfMass(geojson).geometry.coordinates as [number, number];
          }

          if (geojson.geometry.type === 'MultiPolygon') {
            return turf.centerOfMass(turf.multiPolygon(geojson.geometry.coordinates)).geometry
              .coordinates as [number, number];
          }

          return null;
        };

        const center = getCenter(feature);
        return {
          ...feature,
          id: String(feature.id),
          isStatisticsPopupOpen: existingPolygon?.isStatisticsPopupOpen ?? true,
          pixelPosition: center ? mapInstance.project(center) : existingPolygon?.pixelPosition ?? { x: 0, y: 0 },
          color,
          name,
          isLocked,
        };
      });

    setPolygons(nextPolygons);
  }, [drawRef, mapRef, polygons, setPolygons]);

  // Sync polygons state with draw control when polygons are loaded
  useEffect(() => {
    if (!shouldInitializeFeatures || !map) return;
    if (!drawRef.current) {
      const id = window.setTimeout(() => setDrawReadyTick(tick => tick + 1), 100);
      return () => window.clearTimeout(id);
    }

    const draw = drawRef.current;
    const currentDrawFeatures = draw.getAll().features;

    if (polygons.length > 0 && currentDrawFeatures.length === 0) {
      polygons.forEach(polygon => {
        try {
          const feature = {
            type: 'Feature' as const,
            geometry: polygon.geometry,
            properties: {
              ...(polygon.properties || {}),
              user_color: polygon.color,
              user_name: polygon.name,
            },
            id: polygon.id,
          } as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
          draw.add(feature);
        } catch (error) {
          console.error('Error adding polygon to draw control:', error);
        }
      });
    } else if (polygons.length === 0 && currentDrawFeatures.length > 0) {
      draw.deleteAll();
    }
  }, [polygons, shouldInitializeFeatures, map, drawRef, drawReadyTick]);

  useEffect(() => {
    if (!shouldInitializeFeatures || !map) return;
    if (!drawRef.current) {
      const id = window.setTimeout(() => setDrawReadyTick(tick => tick + 1), 100);
      return () => window.clearTimeout(id);
    }

    /**
     * Click handler for polygons, opens and closes the statistics popup
     */
    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
      const coordinates = e.lngLat;
      const point = [coordinates.lng, coordinates.lat];

      const clickedPolygon = polygons.find(polygon => {
        try {
          if (polygon.geometry.type === 'Polygon') {
            const turfPolygon = turf.polygon(polygon.geometry.coordinates as number[][][]);
            return turf.booleanPointInPolygon(point, turfPolygon);
          } else if (polygon.geometry.type === 'MultiPolygon') {
            const turfMultiPolygon = turf.multiPolygon(
              polygon.geometry.coordinates as number[][][][]
            );
            return turf.booleanPointInPolygon(point, turfMultiPolygon);
          } else {
            console.error('Unsupported geometry type:', polygon.geometry.type);
            return false;
          }
        } catch (error) {
          console.error('Error processing polygon:', error);
          return false;
        }
      });

      if (clickedPolygon) {
        const pixelPosition = map.project(coordinates);
        setPolygons(prev =>
          prev.map(polygon => {
            if (polygon.id === clickedPolygon.id) {
              return {
                ...polygon,
                isStatisticsPopupOpen: !polygon.isStatisticsPopupOpen, // Toggle popup
                pixelPosition: pixelPosition,
              };
            }
            return polygon;
          })
        );
      }
    };

    /**
     * Draw handler for polygons, creates a new polygon
     */
    const handleDrawCreate = () => {
      syncPolygonsFromDraw();
    };

    /**
     * Selection change handler to deselect locked polygons
     */
    const handleSelectionChange = (e: { features: GeoJSON.Feature[] }) => {
      const selectedLockedFeatures = e.features.filter(f => {
        const poly = polygons.find(p => p.id === String(f.id));
        return poly?.isLocked;
      });

      if (selectedLockedFeatures.length > 0 && drawRef.current) {
        try {
          drawRef.current.changeMode('simple_select', { featureIds: [] });
        } catch (err) {
          console.error('Error deselecting locked feature:', err);
        }
      }
    };

    /**
     * Update handler for polygons
     */
    const handleDrawUpdate = (e: { features: GeoJSON.Feature[]; action: string }) => {
      let hasLockedUpdate = false;
      e.features.forEach(feature => {
        const existingPolygon = polygons.find(p => p.id === String(feature.id));
        if (existingPolygon?.isLocked) {
          hasLockedUpdate = true;
          if (drawRef.current) {
            try {
              const oldFeature = {
                type: 'Feature' as const,
                geometry: existingPolygon.geometry,
                properties: {
                  ...(existingPolygon.properties || {}),
                  user_color: existingPolygon.color,
                  user_name: existingPolygon.name,
                },
                id: existingPolygon.id,
              } as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
              drawRef.current.add(oldFeature);
            } catch (err) {
              console.error('Error reverting locked feature in Mapbox Draw:', err);
            }
          }
        }
      });

      if (!hasLockedUpdate) {
        syncPolygonsFromDraw();
      }
    };

    /**
     * Delete handler for polygons, deletes a polygon
     */
    const handleDrawDelete = () => {
      syncPolygonsFromDraw();
    };

    /**
     * Event listeners
     */
    map.on('click', handleMapClick);
    map.on('draw.create', handleDrawCreate);
    map.on('draw.selectionchange', handleSelectionChange);
    map.on('draw.update', handleDrawUpdate);
    map.on('draw.delete', handleDrawDelete);

    /**
     * Cleanup function
     */
    return () => {
      if (map) {
        map.off('click', handleMapClick);
        map.off('draw.create', handleDrawCreate);
        map.off('draw.selectionchange', handleSelectionChange);
        map.off('draw.update', handleDrawUpdate);
        map.off('draw.delete', handleDrawDelete);
      }
    };
  }, [map, shouldInitializeFeatures, polygons, setPolygons, syncPolygonsFromDraw, drawRef, drawReadyTick]);
}
