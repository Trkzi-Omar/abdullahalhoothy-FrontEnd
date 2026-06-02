import { useEffect, useCallback } from 'react';
import * as turf from '@turf/turf';
import { useCatalogContext } from '../../context/CatalogContext';
import { useMapContext } from '../../context/MapContext';

export function usePolygonHandlers() {
  const { mapRef, shouldInitializeFeatures, drawRef } = useMapContext();
  const map = mapRef.current;
  const { polygons, setPolygons } = useCatalogContext();

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
        };
      });

    setPolygons(nextPolygons);
  }, [drawRef, mapRef, polygons, setPolygons]);

  // Sync polygons state with draw control when polygons are loaded
  useEffect(() => {
    if (!shouldInitializeFeatures || !map || !drawRef.current) return;

    const draw = drawRef.current;
    const currentDrawFeatures = draw.getAll().features;

    if (polygons.length > 0 && currentDrawFeatures.length === 0) {
      polygons.forEach(polygon => {
        try {
          const feature = {
            type: 'Feature' as const,
            geometry: polygon.geometry,
            properties: polygon.properties || {},
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
  }, [polygons, shouldInitializeFeatures, map, drawRef]);

  useEffect(() => {
    if (!shouldInitializeFeatures || !map) return;

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
     * Update handler for polygons
     */
    const handleDrawUpdate = () => {
      syncPolygonsFromDraw();
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
    map.on('draw.update', handleDrawUpdate);
    map.on('draw.delete', handleDrawDelete);

    /**
     * Cleanup function
     */
    return () => {
      if (map) {
        map.off('click', handleMapClick);
        map.off('draw.create', handleDrawCreate);
        map.off('draw.update', handleDrawUpdate);
        map.off('draw.delete', handleDrawDelete);
      }
    };
  }, [map, shouldInitializeFeatures, polygons, setPolygons, syncPolygonsFromDraw]);
}
