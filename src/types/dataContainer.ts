export type LayerUploadFormData = {
  title: string;
  file: File | null;
  delete_after_days: string;
  points_color: string;
  deduplicate: boolean;
  name_column: string;
  lat_column: string;
  lon_column: string;
};

export type MappingKey = 'name_column' | 'lat_column' | 'lon_column';

export type UploadedLayerFeature = {
  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
  properties?: Record<string, unknown>;
};
