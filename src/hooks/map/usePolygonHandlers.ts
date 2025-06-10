import { useEffect } from 'react';
import * as turf from '@turf/turf';
import { useCatalogContext } from '../../context/CatalogContext';
import { useMapContext } from '../../context/MapContext';

export function usePolygonHandlers() {
  const { mapRef, shouldInitializeFeatures, drawRef } = useMapContext();
  const map = mapRef.current;
  const { polygons, setPolygons } = useCatalogContext();

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
            geometry: polygon.geometry as any,
            properties: polygon.properties || {},
            id: polygon.id,
          };
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
    const handleDrawCreate = (e: any) => {
      if (!e.features || !e.features[0]) return;

      const geojson = e.features[0];
      // Get center point of polygon
      let center;
      if (geojson.geometry.type === 'Polygon') {
        center = turf.centerOfMass(geojson).geometry.coordinates;
      } else if (geojson.geometry.type === 'MultiPolygon') {
        center = turf.centerOfMass(turf.multiPolygon(geojson.geometry.coordinates)).geometry
          .coordinates;
      }

      // Convert center to pixel coordinates
      const pixelPosition = center ? map.project(center as [number, number]) : null;

      // Set the shape property for regular polygons
      if (!geojson.properties) geojson.properties = {};
      geojson.properties.shape = geojson.properties.shape ? geojson.properties.shape : 'polygon';

      // Create PolygonFeature with required properties
      const polygonFeature = {
        ...geojson,
        isStatisticsPopupOpen: true,
        pixelPosition: pixelPosition,
      };

      setPolygons(prev => [...prev, polygonFeature]);
    };

    /**
     * Update handler for polygons
     */
    const handleDrawUpdate = (e: any) => {
      if (!e.features || !e.features[0]) return;

      const geojson = e.features[0];
      const updatedPolygonsId = e.features[0].id;

      // Get center point of updated polygon
      let center;
      if (geojson.geometry.type === 'Polygon') {
        center = turf.centerOfMass(geojson).geometry.coordinates;
      } else if (geojson.geometry.type === 'MultiPolygon') {
        center = turf.centerOfMass(turf.multiPolygon(geojson.geometry.coordinates)).geometry
          .coordinates;
      }

      // Convert center to pixel coordinates
      const pixelPosition = center ? map.project(center as [number, number]) : null;

      // Create updated PolygonFeature with required properties
      const updatedPolygonFeature = {
        ...geojson,
        isStatisticsPopupOpen: true,
        pixelPosition: pixelPosition,
      };

      setPolygons(prev =>
        prev.map(polygon => (polygon.id === updatedPolygonsId ? updatedPolygonFeature : polygon))
      );
    };

    /**
     * Delete handler for polygons, deletes a polygon
     */
    const handleDrawDelete = (e: any) => {
      if (!e.features || !e.features[0]) return;

      const deletedPolygonsId = e.features[0].id;
      setPolygons(prev => prev.filter(polygon => polygon.id !== deletedPolygonsId));
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
  }, [map, shouldInitializeFeatures, polygons, setPolygons]);
}
