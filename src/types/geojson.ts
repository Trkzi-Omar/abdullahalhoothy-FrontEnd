export type GeoJsonPolygon = {
  type: 'Polygon';
  coordinates: number[][][];
};

export type GeoJsonFeature = {
  type: 'Feature';
  properties: Record<string, unknown>;
  geometry: GeoJsonPolygon;
};

export type GeoJsonFeatureCollection = {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
};
