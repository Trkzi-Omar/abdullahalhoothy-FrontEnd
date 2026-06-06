import type { GeoJsonFeatureCollection } from './geojson';

/** A single district item returned by the districts API. */
export interface DistrictItem {
  district_id: number;
  city_id: number;
  region_id: number;
  local_seq: number;
  name_ar: string;
  name_en: string;
}

/** Response shape for polygon/normalize, polygon/add-district, polygon/subtract-district endpoints. */
export interface PolygonOpResponse {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: Record<string, unknown>;
    geometry: { type: string; coordinates: unknown };
  }>;
}

/** Response shape for the districts/borders endpoint. */
export interface BordersResponse {
  type: 'FeatureCollection';
  city_name: string;
  district_ids: number[];
  total_count: number;
  features: Array<{
    type: 'Feature';
    id: string;
    properties: Record<string, unknown>;
    geometry: { type: string; coordinates: unknown };
  }>;
}

export interface GroupInfo {
  lat: number | null;
  lng: number | null;
  phone: string;
}

/** Per-driver territory info: independent polygon, position, and display color. */
export interface DriverInfo {
  id: string;
  lat: number | null;
  lng: number | null;
  phone: string;
  polygon: GeoJsonFeatureCollection;
  color: string;
  selectedDistrictIds: number[];
}

export interface UserLayer {
  layer_id: string;
  dataset_id: string;
  user_id: string;
  title: string;
  points_color: string;
  created_at: string;
  delete_at: string;
  records_count: number;
}

/**
 * Mirrors ReqTerritoryDesignVRP in the main API (request_dtypes.py).
 * complementary_categories is a transient UI field joined into boolean_query before submit.
 *
 * Multi-driver: each driver has their own independent polygon & position.
 * On submit we iterate drivers and send one request per driver with num_groups=1.
 */
export interface VrpReportData {
  // Auth / location
  user_id: string;
  city_name: string;
  country_name: string;

  // POI query — per-driver polygons replace the old single polygons field
  drivers: DriverInfo[];

  boolean_query: string;
  excluded_names: string[];
  complementary_categories?: string[];

  // Territory clustering (per-driver, num_groups is fixed to 1 per driver)
  num_groups: number;
  outlier_cut_km: number;
  warehouse_lat: number | null;
  warehouse_lng: number | null;
  group_size_prune_max: number;
  max_solving_time: number;

  // Uploaded layer (optional)
  uploaded_layer_id?: string | null;
  use_uploaded_data_only?: boolean;
  mandatory_layer_id?: string | null;

  // VRP scheduling
  num_work_days: number;

  // Contact
  manager_phone: string;

  // Cost / savings inputs
  current_daily_km_per_van: number;
  weekly_refill_sar: number;
  work_hours_per_day: number;
  store_visit_minutes: number;
  current_stores_per_day: number;
  driver_monthly_salary_sar: number;
  planner_monthly_salary_sar: number;
  work_days_per_week: number;
  work_days_per_month: number;
  avg_revenue_per_store_sar: number;
  revenue_period_days: number;

}
