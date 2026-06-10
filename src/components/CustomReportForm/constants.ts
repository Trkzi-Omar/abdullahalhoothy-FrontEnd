import { CustomReportData, SegmentEvaluationMetrics } from '../../types/allTypesAndInterfaces';
import mapConfig from '../../mapConfig.json';
import { BusinessTypeConfig } from './services/businessMetricsService';
import { t } from '../../i18n';

export const CITY_OPTIONS = ['Riyadh', 'Mecca', 'Jeddah'];

type StepDefinition = {
  id: number;
  title: string;
  description: string;
  content: string;
  isAdvanced?: boolean;
};

const getBaseStepDefinitions = (reportType: 'full' | 'location'): StepDefinition[] =>
  reportType === 'full'
    ? [
        {
          id: 1,
          title: t('basic-information'),
          description: t('city-and-location-details'),
          content: 'basic-info',
        },
        {
          id: 2,
          title: t('segment-selection'),
          description: t('select-segment-type'),
          content: 'segment-selection',
        },
        {
          id: 3,
          title: t('delivery-vs-in-store'),
          description: t('set-delivery-preferences'),
          content: 'delivery-in-store',
          isAdvanced: true,
        },
        {
          id: 4,
          title: t('evaluation-metrics'),
          description: t('set-importance-weights'),
          content: 'evaluation-metrics',
          isAdvanced: true,
        },
        {
          id: 5,
          title: t('set-attributes'),
          description: t('set-required-attributes'),
          content: 'attributes',
          isAdvanced: true,
        },
        {
          id: 6,
          title: t('custom-locations'),
          description: t('add-specific-locations'),
          content: 'custom-locations',
          isAdvanced: true,
        },
        {
          id: 7,
          title: t('current-location'),
          description: t('set-your-current-position'),
          content: 'current-location',
          isAdvanced: true,
        },
        {
          id: 8,
          title: t('report-tier'),
          description: t('choose-report-tier'),
          content: 'report-tier',
        },
      ]
    : [
        {
          id: 1,
          title: t('basic-information'),
          description: t('city-and-location-details'),
          content: 'basic-info',
        },
        {
          id: 2,
          title: t('segment-selection'),
          description: t('select-segment-type'),
          content: 'segment-selection',
        },
        {
          id: 3,
          title: t('delivery-vs-in-store'),
          description: t('set-delivery-preferences'),
          content: 'delivery-in-store',
          isAdvanced: true,
        },
        {
          id: 4,
          title: t('evaluation-metrics'),
          description: t('set-importance-weights'),
          content: 'evaluation-metrics',
          isAdvanced: true,
        },
        {
          id: 5,
          title: t('set-attributes'),
          description: t('set-required-attributes'),
          content: 'attributes',
          isAdvanced: true,
        },
        {
          id: 6,
          title: t('custom-location'),
          description: t('location-to-evaluate-2'),
          content: 'custom-locations',
        },
        {
          id: 7,
          title: t('current-location'),
          description: t('set-your-current-position'),
          content: 'current-location',
        },
        {
          id: 8,
          title: t('report-tier'),
          description: t('choose-report-tier'),
          content: 'report-tier',
        },
      ];

export const getTotalSteps = (
  reportType: 'full' | 'location' | null,
  isAdvancedMode: boolean = true,
  needsPhoneVerification: boolean = false
): number => {
  if (!reportType) return 1; // Step 0 only

  const stepDefinitions = getBaseStepDefinitions(reportType);
  const filteredSteps = isAdvancedMode
    ? stepDefinitions
    : stepDefinitions.filter(step => !step.isAdvanced);

  return filteredSteps.length + (needsPhoneVerification ? 1 : 0);
};

export const getStepDefinitions = (
  reportType: 'full' | 'location' | null,
  isAdvancedMode: boolean = true,
  needsPhoneVerification: boolean = false
) => {
  if (!reportType) return [];

  const baseSteps = getBaseStepDefinitions(reportType);
  const steps = isAdvancedMode ? [...baseSteps] : baseSteps.filter(step => !step.isAdvanced);

  if (needsPhoneVerification) {
    // Insert Phone Verification step before the last step (Report Tier)
    const lastStepIndex = steps.length - 1;
    const phoneStep = {
      id: steps.length + 100, // Temporary ID to avoid conflict, but display logic relies on index.
      title: t('phone-verification-2'),
      description: t('verify-your-phone-number'),
      content: 'phone-verification',
    };

    // Insert before Report Tier (which is usually the last one)
    steps.splice(lastStepIndex, 0, phoneStep);
  }

  return steps;
};

export const getInitialFormData = (
  businessType: string,
  config: BusinessTypeConfig
): CustomReportData => {
  // Use API configuration - no fallbacks
  const defaultMetrics = Object.fromEntries(
    Object.entries(config.metrics).map(([key, metric]) => [key, metric.default_weight])
  ) as unknown as SegmentEvaluationMetrics;

  return {
    user_id: '',
    city_name: 'Riyadh',
    country_name: mapConfig.fallBackCountry,
    Type: businessType,
    potential_business_type: businessType,
    rental_property_type: 'shop_for_rent',
    ecosystem_string_name: '',
    evaluation_metrics: defaultMetrics,
    custom_locations: [{ lat: 0, lng: 0, properties: { price: 0 } }],
    current_location: { lat: 0, lng: 0, properties: { price: 0, avg_order_value: 30 } },
    target_age: 30,
    target_income_level: 'medium',
    complementary_categories: [],
    cross_shopping_categories: [],
    competition_categories: [],
    report_tier: 'premium',
    delivery_weight: 0.5,
    dine_in_weight: 0.5,
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
