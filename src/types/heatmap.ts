import type { Feature } from 'geojson';

export type HeatmapFeature = Feature & {
  id?: string | number;
  properties: Record<string, unknown>;
};
