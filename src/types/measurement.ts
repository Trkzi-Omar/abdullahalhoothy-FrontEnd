export type MeasurementApiResponse = {
  data?: {
    drive_polygon?: unknown;
    distance_in_km?: number | null;
    drive_time_in_min?: number | null;
    route?: Array<{
      distance?: number;
      duration?: string | number;
      polyline?: unknown;
    }>;
  };
  message?: string;
  request_id?: string;
};

export type MeasurementResult = {
  message?: string;
  polygon: unknown;
  distance: number | null;
  duration: number | null;
  request_id?: string;
};

export type PopupElement = Element & {
  _mapboxgl_popup?: {
    remove?: () => void;
  };
};
