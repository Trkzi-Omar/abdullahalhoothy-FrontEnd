import * as turf from '@turf/turf';
import _ from 'lodash';
import { Feature, Polygon, MultiPolygon } from 'geojson';

self.onmessage = async (
  event: MessageEvent<{ featureCollection: { features: Feature<Polygon | MultiPolygon>[] } }>
) => {
  const { featureCollection } = event.data;

  try {
    // Process each polygon feature

    const processedFeatures = featureCollection.features.map(
      (feature: Feature<Polygon | MultiPolygon>, index: number) => {
        try {
          const density = feature.properties?.density || 0;

          const center = turf.center(feature);
          const centerCoords = center.geometry.coordinates;

          if (
            !Array.isArray(centerCoords) ||
            centerCoords.length !== 2 ||
            typeof centerCoords[0] !== 'number' ||
            typeof centerCoords[1] !== 'number'
          ) {
            console.error('Invalid center coordinates:', {
              feature: index,
              coords: centerCoords,
              geometry: feature.geometry,
            });
            return feature;
          }

          const center_obj = {
            lng: Number(centerCoords[0]),
            lat: Number(centerCoords[1]),
          };

          // Calculate area of the polygon
          const area = turf.area(feature);

          return {
            ...feature,
            id: index,
            properties: {
              ...feature.properties,
              density,
              center: center_obj,
              area: _.round(area, 2),
            },
          };
        } catch (error) {
          console.error(`Error processing polygon ${index}:`, error);
          return feature;
        }
      }
    );

    self.postMessage({
      features: processedFeatures,
      type: 'FeatureCollection',
    });
  } catch (error) {
    console.error('Worker error:', error);
    self.postMessage({
      error: error instanceof Error ? error.message : String(error),
      details: {
        featureCollectionValid: !!featureCollection?.features,
      },
    });
  }
};
