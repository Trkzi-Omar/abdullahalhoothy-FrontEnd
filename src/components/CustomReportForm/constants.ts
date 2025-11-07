import { CustomReportData } from '../../types/allTypesAndInterfaces';
import mapConfig from '../../mapConfig.json';
import { BusinessTypeConfig } from './services/businessMetricsService';

export const CITY_OPTIONS = ['Riyadh', 'Mecca', 'Jeddah'];

export const TOTAL_STEPS = 6;

export const getInitialFormData = (
  businessType: string,
  config: BusinessTypeConfig
): CustomReportData => {
  // Use API configuration - no fallbacks
  const defaultMetrics = Object.fromEntries(
    Object.entries(config.metrics).map(([key, metric]) => [key, metric.default_weight])
  );

  return {
    user_id: '',
    city_name: 'Riyadh',
    country_name: mapConfig.fallBackCountry,
    Type: businessType,
    evaluation_metrics: defaultMetrics,
    custom_locations: [{ lat: 0, lng: 0 }],
    current_location: { lat: 0, lng: 0 },
    target_age: 30,
    target_income_level: 'medium',
    complementary_categories: [],
    cross_shopping_categories: [],
    competition_categories: [],
  };
};

export const getBusinessTypeConfig = (config: BusinessTypeConfig) => {
  // Use API configuration - no fallbacks
  return {
    displayName: config.display_name,
    icon: config.icon,
    description: config.description,
  };
};
