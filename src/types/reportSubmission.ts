// Location properties for custom/current locations
export interface LocationProperties {
  price?: number;
  avg_order_value?: number;
}

// Custom location with properties
export interface CustomLocationWithProperties {
  lat: number;
  lng: number;
  properties?: LocationProperties;
}

// Current location with properties
export interface CurrentLocationWithProperties {
  lat: number;
  lng: number;
  properties?: LocationProperties;
}

// Report submission request body
export interface ReportSubmissionRequestBody {
  user_id: string;
  city_name: string;
  country_name: string;
  potential_business_type: string;
  target_income_level?: string;
  target_age?: number;
  avg_order_value?: number;
  walking_distance?: number;
  time1_peak?: number;
  time1_offpeak?: number;
  time2_peak?: number;
  time3_peak?: number;
  peak_time_iso8601?: string;
  offpeak_time_iso8601?: string;
  iso_names?: string[];
  iso_display_names?: string[];
  iso_colors?: string[];
  // Delivery demographics weights
  delivery_demographics_deviation_from_target?: number;
  delivery_demographics_category_density?: number;
  delivery_demographics_population_per_business?: number;
  delivery_demographics_estimated_overlap?: number;
  delivery_demographics_traffic_variability?: number;
  delivery_demographics_fuel_cost?: number;
  // Delivery competition weights
  delivery_competition_deviation_from_target?: number;
  delivery_competition_category_density?: number;
  delivery_competition_population_per_business?: number;
  delivery_competition_estimated_overlap?: number;
  // Delivery complementary weights
  delivery_complementary_deviation_from_target?: number;
  delivery_complementary_category_density?: number;
  delivery_complementary_population_per_business?: number;
  delivery_complementary_estimated_overlap?: number;
  // Delivery cross shopping weights
  delivery_cross_shopping_deviation_from_target?: number;
  delivery_cross_shopping_category_density?: number;
  delivery_cross_shopping_population_per_business?: number;
  delivery_cross_shopping_estimated_overlap?: number;
  // Delivery cost parameters
  delivery_driver_salary_per_hour?: number;
  delivery_fuel_cost_per_km?: number;
  delivery_expected_orders_per_day?: number;
  delivery_time_cost_multiplier?: number;
  delivery_rent_based_cost_efficiency?: number;
  // Dine-in demographics weights
  dine_in_demographics_deviation_from_target?: number;
  dine_in_demographics_category_density?: number;
  dine_in_demographics_population_per_business?: number;
  dine_in_demographics_estimated_overlap?: number;
  dine_in_demographics_traffic_variability?: number;
  dine_in_demographics_fuel_cost?: number;
  // Dine-in competition weights
  dine_in_competition_deviation_from_target?: number;
  dine_in_competition_category_density?: number;
  dine_in_competition_population_per_business?: number;
  dine_in_competition_estimated_overlap?: number;
  // Dine-in complementary weights
  dine_in_complementary_deviation_from_target?: number;
  dine_in_complementary_category_density?: number;
  dine_in_complementary_population_per_business?: number;
  dine_in_complementary_estimated_overlap?: number;
  // Dine-in cross shopping weights
  dine_in_cross_shopping_deviation_from_target?: number;
  dine_in_cross_shopping_category_density?: number;
  dine_in_cross_shopping_population_per_business?: number;
  dine_in_cross_shopping_estimated_overlap?: number;
  // Delivery zone weights
  delivery_zone_walking_distance?: number;
  delivery_zone_time1_peak?: number;
  delivery_zone_time1_offpeak?: number;
  delivery_zone_time2_peak?: number;
  delivery_zone_time3_peak?: number;
  // Dine-in zone weights
  dine_in_zone_walking_distance?: number;
  dine_in_zone_time1_peak?: number;
  dine_in_zone_time1_offpeak?: number;
  dine_in_zone_time2_peak?: number;
  dine_in_zone_time3_peak?: number;
  // Category weights
  dine_in_demographics_weight?: number;
  dine_in_competition_weight?: number;
  dine_in_complementary_weight?: number;
  dine_in_cross_shopping_weight?: number;
  dine_in_traffic_weight?: number;
  delivery_demographics_weight?: number;
  delivery_competition_weight?: number;
  delivery_complementary_weight?: number;
  delivery_cross_shopping_weight?: number;
  delivery_traffic_weight?: number;
  // Overall weights
  delivery_weight?: number;
  dine_in_weight?: number;
  // Categories
  complementary_categories?: string[];
  optimal_num_complementary_businesses_per_category?: number;
  cross_shopping_categories?: string[];
  optimal_num_cross_shopping_businesses_per_category?: number;
  competition_categories?: string[];
  optimal_num_competition_businesses_per_category?: number;
  // Optimal per capita values
  optimal_competition_per_capita?: number;
  optimal_complementary_per_capita?: number;
  optimal_cross_shopping_per_capita?: number;
  // Locations
  custom_locations?: CustomLocationWithProperties[];
  current_location?: CurrentLocationWithProperties;
  single_location?: boolean;
  report_tier?: string;
  report_potential_business_type?: string;
}

// Full submission data structure
export interface SubmissionData {
  message?: string;
  request_info?: Record<string, unknown>;
  request_body: ReportSubmissionRequestBody;
}
