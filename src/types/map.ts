import type { PolygonFeature } from './allTypesAndInterfaces';

export type CityBounds = {
  bounds: [number, number, number, number];
  center: [number, number];
};

export type CityApiItem = {
  name: string;
  lng: number;
  lat: number;
  borders: {
    southwest: { lng: number; lat: number };
    northeast: { lng: number; lat: number };
  };
};

export type WorkerFeatureResponse = {
  features: GeoJSON.Feature[];
};

export type DrawEvent = {
  features?: PolygonFeature[];
};
