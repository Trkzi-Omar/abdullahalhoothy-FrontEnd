import { useMemo, useEffect } from 'react';
import { CustomReportData } from '../../../types/allTypesAndInterfaces';
import {
  useTierPricing,
  useLocationPricing,
  formatPrice as formatPriceHelper,
} from '../hooks/useReportPricing';

interface ReportTierStepProps {
  formData: CustomReportData;
  onInputChange: (field: string, value: any) => void;
  disabled?: boolean;
  reportType?: 'full' | 'location';
  hasUsedFreeLocationReport?: boolean;
  isAdvancedMode?: boolean;
  onPriceLoadingChange?: (isLoading: boolean, priceAvailable: boolean) => void;
}

const ReportTierStep = ({
  formData,
  onInputChange,
  disabled = false,
  reportType,
  hasUsedFreeLocationReport = false,
  isAdvancedMode = false,
  onPriceLoadingChange,
}: ReportTierStepProps) => {
  // Collect all selected datasets from categories (memoized to prevent infinite loops)
  const allDatasets = useMemo(() => {
    const datasets: string[] = [];
    if (formData.complementary_categories) {
      datasets.push(...formData.complementary_categories);
    }
    if (formData.competition_categories) {
      datasets.push(...formData.competition_categories);
    }
    if (formData.cross_shopping_categories) {
      datasets.push(...formData.cross_shopping_categories);
    }
    return datasets;
  }, [
    formData.complementary_categories,
    formData.competition_categories,
    formData.cross_shopping_categories,
  ]);

  // Memoize datasets for location pricing to prevent creating new array references
  const locationDatasets = useMemo(() => {
    return isAdvancedMode ? allDatasets : [];
  }, [isAdvancedMode, allDatasets]);

  // For full reports, fetch all tier pricing
  const {
    basicPrice,
    standardPrice,
    premiumPrice,
    tierAvailability,
    isLoading: isLoadingPrices,
    refetch: refetchTierPrices,
  } = useTierPricing({
    country: formData.country_name,
    city: formData.city_name,
    datasets: allDatasets,
    report_potential_business_type: formData.Type,
    enabled: reportType !== 'location',
  });

  // For location reports, fetch location pricing
  const {
    price: locationReportPrice,
    comingSoon: locationComingSoon,
    isLoading: isLoadingLocationPrice,
    refetch: refetchLocationPrice,
  } = useLocationPricing({
    country: formData.country_name,
    city: formData.city_name,
    datasets: locationDatasets,
    reportType: 'single_location_premium',
    report_potential_business_type: formData.Type,
    enabled: reportType === 'location',
    onLoadingChange: onPriceLoadingChange,
  });

  // Refetch prices whenever the step is rendered or when datasets change
  // This ensures cost is recalculated every time user navigates to step 8
  useEffect(() => {
    // Only refetch if we have the required data (country and city)
    if (formData.country_name && formData.city_name) {
      if (reportType === 'location') {
        refetchLocationPrice();
      } else {
        refetchTierPrices();
      }
    }
  }, [
    formData.country_name,
    formData.city_name,
    reportType,
    // Include datasets to refetch when categories change
    // Using join to create a stable string representation for comparison
    allDatasets.join(','),
    locationDatasets.join(','),
    refetchLocationPrice,
    refetchTierPrices,
  ]);

  // Create tierPrices object for backwards compatibility with existing JSX
  const tierPrices = {
    basic: basicPrice,
    standard: standardPrice,
    premium: premiumPrice,
  };

  // Default to premium if not set
  const currentTier = formData.report_tier || 'premium';

  // Helper function to format price (uses formatPrice from hooks)
  const formatPriceValue = (price: number | null): string => {
    return formatPriceHelper(price, isLoadingPrices);
  };

  // For location reports, show dynamic pricing from API
  if (reportType === 'location') {
    // Determine price display
    const getPriceDisplay = (): string => {
      if (isLoadingLocationPrice) {
        return '...';
      }
      if (locationReportPrice === null) {
        return 'Price unavailable';
      }
      if (locationReportPrice === 0) {
        return 'FREE';
      }
      return `$${locationReportPrice.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
    };

    const priceDisplay = getPriceDisplay();
    const isFree = locationReportPrice === 0;
    const isNotFree = locationReportPrice !== null && locationReportPrice > 0;

    // If user has already used their free report OR if price is not free, show two cards
    if (hasUsedFreeLocationReport || isNotFree) {
      return (
        <div className="space-y-4 animate-fade-in-up">
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Location Analysis Report</h3>
            <p className="text-sm text-gray-600">
              Choose your report option
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Free Report Card - Already Used (Grayed Out) */}
            <div className="relative border-2 border-gray-300 bg-gray-100/60 rounded-xl p-6 opacity-75">
              <div className="absolute top-3 right-3">
                <span className="text-xs bg-gray-400 text-white px-3 py-1 rounded-full font-semibold">
                  Already Claimed
                </span>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-gray-500 mb-2">
                  FREE
                </div>
                <div className="text-sm text-gray-600 mb-3 font-medium">First Report</div>
                <p className="text-sm text-gray-600 mb-4">
                  You've already used your free location report
                </p>

                <ul className="text-left text-sm text-gray-600 space-y-2 mb-4">
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-2">✓</span>
                    <span>Location database comparison</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-2">✓</span>
                    <span>Demographic analysis</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-2">✓</span>
                    <span>Instant insights</span>
                  </li>
                </ul>

                <a
                  href="/profile"
                  target='_blank'
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  View My Reports
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Paid Report Card - Active */}
            <div className="relative border-2 border-primary bg-gradient-to-br from-primary/5 to-green-50 rounded-xl p-6 shadow-lg">
              <div className="absolute top-3 right-3">
                <span className="text-xs bg-primary text-white px-3 py-1 rounded-full font-semibold">
                  Available Now
                </span>
              </div>

              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {priceDisplay}
                </div>
                <div className="text-sm text-gray-700 mb-3 font-medium">Additional Report</div>
                <p className="text-sm text-gray-700 mb-4">
                  {isLoadingLocationPrice
                    ? 'Calculating price...'
                    : locationReportPrice === null
                    ? 'Unable to calculate price at this time.'
                    : `Get detailed analysis of your specific location`}
                </p>

                {locationReportPrice === null && !isLoadingLocationPrice && (
                  <button
                    onClick={refetchLocationPrice}
                    className="mb-4 px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors font-medium"
                  >
                    Retry Price Calculation
                  </button>
                )}

                <ul className="text-left text-sm text-gray-700 space-y-2 mb-4">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    <span>Compare location to database</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    <span>Detailed demographic analysis</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    <span>Competitive insights</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    <span>Instant recommendations</span>
                  </li>
                </ul>

                <div className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-primary bg-white border-2 border-primary rounded-lg">
                  <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Selected
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Proceed to checkout to purchase your additional location analysis
            </p>
          </div>
        </div>
      );
    }

    // First time users - show single free card
    return (
      <div className="space-y-4 animate-fade-in-up">
        <div className="text-center mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Location Analysis Report</h3>
          <p className="text-sm text-gray-600">
            Instant analysis comparing your location to our database
          </p>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-xl p-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {priceDisplay}
            </div>
            <div className="text-sm text-gray-600 mb-3">First Report</div>
            <p className="text-sm text-gray-700 mb-4">
              {isLoadingLocationPrice
                ? 'Calculating price...'
                : locationReportPrice === null
                ? 'Unable to calculate price at this time. Please retry to continue.'
                : isFree
                ? 'Get your first location analysis absolutely free!'
                : `Get detailed analysis of your specific location for ${priceDisplay}`}
            </p>

            {locationReportPrice === null && !isLoadingLocationPrice && (
              <button
                onClick={refetchLocationPrice}
                className="mb-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Retry Price Calculation
              </button>
            )}

            <ul className="text-left text-sm text-gray-700 space-y-2 max-w-md mx-auto">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Compare your location to existing database</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Detailed demographic and competitive analysis</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Instant insights and recommendations</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // For full reports, use existing tier pricing logic
  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Choose Report Tier</h3>
        <p className="text-sm text-gray-600">
          Select the level of detail and datasets you want in your report
        </p>
        {isLoadingPrices && (
          <p className="text-xs text-gray-500 mt-2 flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-2 h-3 w-3 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Calculating prices...
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {/* Premium Report */}
          {!tierAvailability.premium ? (
            <div className="relative flex items-center p-5 border-2 rounded-xl cursor-not-allowed transition-all duration-200 border-gray-300 bg-gray-100/60 opacity-60">
              <div className="absolute top-3 right-3 z-10">
                <span className="text-xs bg-purple-500 text-white px-3 py-1 rounded-full font-semibold">
                  Coming soon
                </span>
              </div>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center flex-1">
                  <div className="w-5 h-5 border-2 rounded-full mr-4 flex items-center justify-center border-gray-300"></div>
                  <div className="flex-1">
                    <div className="font-bold text-base text-gray-700 mb-1">Premium Report</div>
                    <div className="text-sm text-gray-500">
                      Includes pharmacy, dentists, hospitals, supermarkets, population intelligence,
                      and income intelligence datasets
                    </div>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-xl font-bold text-gray-600">
                    {formatPriceValue(tierPrices.premium)}
                  </div>
                  <div className="text-xs text-gray-500">USD</div>
                </div>
              </div>
            </div>
          ) : (
            <label
              className={`relative flex items-center p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                currentTier === 'premium'
                  ? 'border-primary bg-gradient-to-br from-primary/5 to-green-50 shadow-lg'
                  : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
              } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <input
                type="radio"
                name="report_tier"
                value="premium"
                checked={currentTier === 'premium'}
                onChange={e => onInputChange('report_tier', e.target.value)}
                disabled={disabled}
                className="sr-only"
              />
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center flex-1">
                  <div
                    className={`w-5 h-5 border-2 rounded-full mr-4 flex items-center justify-center transition-all ${
                      currentTier === 'premium' ? 'border-primary bg-primary' : 'border-gray-300'
                    }`}
                  >
                    {currentTier === 'premium' && (
                      <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-base text-gray-900 mb-1">Premium Report</div>
                    <div className="text-sm text-gray-600">
                      Includes pharmacy, dentists, hospitals, supermarkets, population intelligence,
                      and income intelligence datasets
                    </div>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className={`text-xl font-bold ${currentTier === 'premium' ? 'text-primary' : 'text-gray-900'}`}>
                    {formatPriceValue(tierPrices.premium)}
                  </div>
                  <div className="text-xs text-gray-500">USD</div>
                </div>
              </div>
            </label>
          )}

          {/* Standard Report */}
          {!tierAvailability.standard ? (
            <div className="relative flex items-center p-5 border-2 rounded-xl cursor-not-allowed transition-all duration-200 border-gray-300 bg-gray-100/60 opacity-60">
              <div className="absolute top-3 right-3 z-10">
                <span className="text-xs bg-purple-500 text-white px-3 py-1 rounded-full font-semibold">
                  Coming soon
                </span>
              </div>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center flex-1">
                  <div className="w-5 h-5 border-2 rounded-full mr-4 flex items-center justify-center border-gray-300"></div>
                  <div className="flex-1">
                    <div className="font-bold text-base text-gray-700 mb-1">Standard Report</div>
                    <div className="text-sm text-gray-500">
                      Includes complementary and cross-shopping categories analysis
                    </div>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-xl font-bold text-gray-600">
                    {formatPriceValue(tierPrices.standard)}
                  </div>
                  <div className="text-xs text-gray-500">USD</div>
                </div>
              </div>
            </div>
          ) : (
            <label
              className={`relative flex items-center p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                currentTier === 'standard'
                  ? 'border-primary bg-gradient-to-br from-primary/5 to-green-50 shadow-lg'
                  : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
              } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <input
                type="radio"
                name="report_tier"
                value="standard"
                checked={currentTier === 'standard'}
                onChange={e => onInputChange('report_tier', e.target.value)}
                disabled={disabled}
                className="sr-only"
              />
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center flex-1">
                  <div
                    className={`w-5 h-5 border-2 rounded-full mr-4 flex items-center justify-center transition-all ${
                      currentTier === 'standard' ? 'border-primary bg-primary' : 'border-gray-300'
                    }`}
                  >
                    {currentTier === 'standard' && (
                      <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-base text-gray-900 mb-1">Standard Report</div>
                    <div className="text-sm text-gray-600">
                      Includes complementary and cross-shopping categories analysis
                    </div>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className={`text-xl font-bold ${currentTier === 'standard' ? 'text-primary' : 'text-gray-900'}`}>
                    {formatPriceValue(tierPrices.standard)}
                  </div>
                  <div className="text-xs text-gray-500">USD</div>
                </div>
              </div>
            </label>
          )}

          {/* Basic Report */}
          {!tierAvailability.basic ? (
            <div className="relative flex items-center p-5 border-2 rounded-xl cursor-not-allowed transition-all duration-200 border-gray-300 bg-gray-100/60 opacity-60">
              <div className="absolute top-3 right-3 z-10">
                <span className="text-xs bg-purple-500 text-white px-3 py-1 rounded-full font-semibold">
                  Coming soon
                </span>
              </div>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center flex-1">
                  <div className="w-5 h-5 border-2 rounded-full mr-4 flex items-center justify-center border-gray-300"></div>
                  <div className="flex-1">
                    <div className="font-bold text-base text-gray-700 mb-1">Basic Report</div>
                    <div className="text-sm text-gray-500">
                      Core location analysis with your selected business type
                    </div>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-xl font-bold text-gray-600">
                    {formatPriceValue(tierPrices.basic)}
                  </div>
                  <div className="text-xs text-gray-500">USD</div>
                </div>
              </div>
            </div>
          ) : (
            <label
              className={`relative flex items-center p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                currentTier === 'basic'
                  ? 'border-primary bg-gradient-to-br from-primary/5 to-green-50 shadow-lg'
                  : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
              } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <input
                type="radio"
                name="report_tier"
                value="basic"
                checked={currentTier === 'basic'}
                onChange={e => onInputChange('report_tier', e.target.value)}
                disabled={disabled}
                className="sr-only"
              />
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center flex-1">
                  <div
                    className={`w-5 h-5 border-2 rounded-full mr-4 flex items-center justify-center transition-all ${
                      currentTier === 'basic' ? 'border-primary bg-primary' : 'border-gray-300'
                    }`}
                  >
                    {currentTier === 'basic' && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-base text-gray-900 mb-1">Basic Report</div>
                    <div className="text-sm text-gray-600">
                      Core location analysis with your selected business type
                    </div>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className={`text-xl font-bold ${currentTier === 'basic' ? 'text-primary' : 'text-gray-900'}`}>
                    {formatPriceValue(tierPrices.basic)}
                  </div>
                  <div className="text-xs text-gray-500">USD</div>
                </div>
              </div>
            </label>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportTierStep;