import { CustomReportData } from '../../types/allTypesAndInterfaces';
import mapConfig from '../../mapConfig.json';
import { BusinessTypeConfig } from './services/businessMetricsService';

export const CITY_OPTIONS = ['Riyadh', 'Mecca', 'Jeddah'];

export const getTotalSteps = (
  reportType: 'full' | 'location' | null,
  isAdvancedMode: boolean = true
): number => {
  if (!reportType) return 1; // Step 0 only

  const stepDefinitions =
    reportType === 'full' ? FULL_REPORT_STEP_DEFINITIONS : LOCATION_REPORT_STEP_DEFINITIONS;
  const filteredSteps = isAdvancedMode
    ? stepDefinitions
    : stepDefinitions.filter(step => !step.isAdvanced);

  return filteredSteps.length;
};

export const getStepDefinitions = (
  reportType: 'full' | 'location' | null,
  isAdvancedMode: boolean = true
) => {
  if (!reportType) return [];

  const stepDefinitions =
    reportType === 'full' ? FULL_REPORT_STEP_DEFINITIONS : LOCATION_REPORT_STEP_DEFINITIONS;
  return isAdvancedMode ? stepDefinitions : stepDefinitions.filter(step => !step.isAdvanced);
};

// Step definitions for progress indicator and form rendering
export const FULL_REPORT_STEP_DEFINITIONS = [
  {
    id: 1,
    title: 'Basic Information',
    description: 'City and location details',
    content: 'basic-info',
  },
  {
    id: 2,
    title: 'Segment Selection',
    description: 'Select segment type',
    content: 'segment-selection',
  },
  {
    id: 3,
    title: 'Evaluation Metrics',
    description: 'Set importance weights',
    content: 'evaluation-metrics',
    isAdvanced: true,
  },
  {
    id: 4,
    title: 'Set Attributes',
    description: 'Set required attributes',
    content: 'attributes',
    isAdvanced: true,
  },
  {
    id: 5,
    title: 'Custom Locations',
    description: 'Add specific locations',
    content: 'custom-locations',
    isAdvanced: true,
  },
  {
    id: 6,
    title: 'Current Location',
    description: 'Set your current position',
    content: 'current-location',
    isAdvanced: true,
  },
  { id: 7, title: 'Report Tier', description: 'Choose report tier', content: 'report-tier' },
];

export const LOCATION_REPORT_STEP_DEFINITIONS = [
  {
    id: 1,
    title: 'Basic Information',
    description: 'City and location details',
    content: 'basic-info',
  },
  {
    id: 2,
    title: 'Current Location',
    description: 'Set your current position',
    content: 'current-location',
  },
  {
    id: 3,
    title: 'Segment Selection',
    description: 'Select segment type',
    content: 'segment-selection',
  },
  {
    id: 4,
    title: 'Evaluation Metrics',
    description: 'Set importance weights',
    content: 'evaluation-metrics',
    isAdvanced: true,
  },
  {
    id: 5,
    title: 'Set Attributes',
    description: 'Set required attributes',
    content: 'attributes',
    isAdvanced: true,
  },
  { id: 6, title: 'Report Tier', description: 'Choose report tier', content: 'report-tier' },
];

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
    report_tier: 'premium',
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
