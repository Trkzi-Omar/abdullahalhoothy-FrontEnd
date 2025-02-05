import pMap from 'p-map';
import * as turf from '@turf/turf';
import _ from 'lodash';
import RBush from 'rbush';

export interface PropertyStats {
  sum: number;
  values: number[];
  count: number;
  average?: number;
  median?: number;
}

// Build a spatial index for the featureCollection to narrow point-in-polygon checks
const buildSpatialIndex = (featureCollection: any) => {
  const tree = new RBush();
  const items = featureCollection.features.map((feature: any) => {
    const bbox = turf.bbox(feature);
    return { minX: bbox[0], minY: bbox[1], maxX: bbox[2], maxY: bbox[3], feature };
  });
  tree.load(items);
  return tree;
};

self.onmessage = async event => {
  const { grid, featureCollection } = event.data;
  const concurrency = navigator.hardwareConcurrency || 4;
  const spatialIndex = buildSpatialIndex(featureCollection);

  const processedFeatures = await pMap(
    grid.features,
    async (cell: any, index: number) => {
      // Query candidates from spatial index using cell bbox
      const cellBbox = turf.bbox(cell);
      const candidates = spatialIndex.search({
        minX: cellBbox[0],
        minY: cellBbox[1],
        maxX: cellBbox[2],
        maxY: cellBbox[3],
      });

      // Filter candidates with an exact point-in-polygon check
      const pointsWithin = {
        type: 'FeatureCollection',
        features: candidates
          .filter((item: any) => {
            // Assume features are points; use turf.booleanPointInPolygon
            return turf.booleanPointInPolygon(item.feature, cell);
          })
          .map((item: any) => item.feature),
      };

      const density =
        featureCollection.basedon?.length > 0
          ? pointsWithin.features.reduce((sum: number, point: any) => {
              const value = point.properties[featureCollection.basedon];
              return sum + (typeof value === 'number' ? value : 0);
            }, 0)
          : pointsWithin.features.length;

      const center = turf.center(cell);
      const centerCoords = center.geometry.coordinates;
      if (
        !Array.isArray(centerCoords) ||
        centerCoords.length !== 2 ||
        typeof centerCoords[0] !== 'number' ||
        typeof centerCoords[1] !== 'number'
      ) {
        console.error('Invalid center coordinates for cell:', index);
        return cell;
      }
      const center_obj = {
        lng: Number(centerCoords[0]),
        lat: Number(centerCoords[1]),
      };

      const cellProperties: Record<string, PropertyStats> = pointsWithin.features.reduce(
        (acc, point) => {
          Object.entries(point.properties).forEach(([key, value]) => {
            if (value == null) return;
            const numValue = Number(value);
            if (isNaN(numValue)) return;
            if (!acc[key]) {
              acc[key] = {
                sum: 0,
                values: [],
                count: 0,
              };
            }
            acc[key].sum += numValue;
            acc[key].values.push(numValue);
            acc[key].count++;
          });
          return acc;
        },
        {} as Record<string, PropertyStats>
      );

      Object.entries(cellProperties).forEach(([key, stats]) => {
        stats.average = stats.sum / stats.count;
        if (stats.values.length > 0) {
          const sorted = [...stats.values].sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          stats.median =
            sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
        }
      });

      const cellStats = Object.entries(cellProperties).reduce(
        (acc, [key, stats]) => {
          acc[key] = _.round(stats.sum || 0, 2);
          return acc;
        },
        {} as Record<string, number>
      );

      return {
        ...cell,
        id: index,
        properties: {
          ...cell.properties,
          ...cellStats,
          density,
          center: center_obj,
          pointCount: pointsWithin.features.length,
        },
      };
    },
    { concurrency }
  );

  (self as any).postMessage({ features: processedFeatures });
};
