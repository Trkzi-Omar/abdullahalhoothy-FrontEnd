import { useMemo, useEffect } from 'react';
import './ReportTierStep.css';
import { CustomReportData } from '../../../types/allTypesAndInterfaces';
import {
  useTierPricing,
  useLocationPricing,
  formatPrice as formatPriceHelper,
} from '../hooks/useReportPricing';
import { FaBrain, FaUsers, FaDollarSign, FaStar, FaChartLine } from 'react-icons/fa';
import { getPriceNumber as getPriceNumberHelper } from '../../../utils/helperFunctions';

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

  // Helper to extract price number for display
  const getPriceNumber = (price: number | null): string => {
    return getPriceNumberHelper(price, isLoadingPrices);
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
        <div className="font-sans text-[#1a1a1a] pt-6 px-5 pb-0 overflow-x-hidden min-h-full">
          <div className="max-w-[62.5rem] mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-[#1a1a1a]">Location Analysis Report</h2>
              <p className="text-[#666] text-[0.95rem] mt-2">Choose your report option</p>
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] gap-4">
              {/* Free Report Card - Already Used */}
              <div className="relative border-2 border-[#d1d5db] rounded-2xl p-6 bg-gradient-to-br from-[rgba(156,163,175,0.1)] to-[#f9fafb] shadow-[0_0.25rem_1rem_rgba(0,0,0,0.05)] opacity-75 cursor-pointer transition-all duration-[250ms] ease-in-out">
                <span className="absolute top-4 right-4 bg-[#9ca3af] text-white py-[0.35rem] px-[0.85rem] rounded-full text-xs font-bold tracking-[0.03em] used-pill-text">First Report</span>
                <div className="text-[2rem] font-extrabold text-[#9ca3af] mb-[0.35rem]">FREE</div>
                <div className="text-[#666] mb-3 font-semibold">Single Location</div>
                <p className="text-[#666] text-[0.95rem] mb-4 leading-relaxed">
                  You've already used your free location report
                </p>
                <ul className="grid gap-[0.6rem] list-none p-0 mb-4">
                  <li className="flex items-center gap-2 text-[#1a1a1a] text-[0.9rem]"><span className="text-[#d1d5db] font-extrabold">✓</span>Compare your location to existing database</li>
                  <li className="flex items-center gap-2 text-[#1a1a1a] text-[0.9rem]"><span className="text-[#d1d5db] font-extrabold">✓</span>Detailed demographic and competitive analysis</li>
                  <li className="flex items-center gap-2 text-[#1a1a1a] text-[0.9rem]"><span className="text-[#d1d5db] font-extrabold">✓</span>Instant insights and recommendations</li>
                </ul>
                <a
                  href="/profile"
                  target='_blank'
                  className="block w-full py-[0.8125rem] px-7 my-4 border-2 border-[#e8e8e8] rounded-[0.625rem] text-[0.8125rem] font-semibold font-rajdhani tracking-[0.0312rem] cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] uppercase text-center text-brand-green bg-transparent hover:border-brand-green hover:bg-[rgba(72,158,70,0.05)] cta-shimmer"
                >
                  View My Reports
                </a>
              </div>

              {/* Paid Report Card - Active */}
              <div className="relative border-[3px] border-[rgba(125,0,184,0.7)] rounded-2xl p-6 shadow-[0_0.5rem_1.5rem_rgba(125,0,184,0.25)] transition-all duration-[250ms] ease-in-out hover:-translate-y-[3px] hover:shadow-[0_0.5rem_1.5rem_rgba(0,0,0,0.08)]" style={{ background: 'linear-gradient(135deg, rgba(125,0,184,0.06), rgba(72,158,70,0.08))' }}>
                <span className="absolute top-4 right-4 bg-gem text-white py-[0.35rem] px-[0.85rem] rounded-full text-xs font-bold tracking-[0.03em]">Available Now</span>
                <div className="text-[2rem] font-extrabold text-brand-green mb-[0.35rem]">{priceDisplay}</div>
                <div className="text-[#666] mb-3 font-semibold">Evaluate Your Location</div>
                <p className="text-[#666] text-[0.95rem] mb-4 leading-relaxed">
                  {isLoadingLocationPrice
                    ? 'Calculating price...'
                    : locationReportPrice === null
                    ? 'Unable to calculate price at this time.'
                    : 'Get a fresh deep-dive on another site with competitive insights and instant recommendations.'}
                </p>

                {locationReportPrice === null && !isLoadingLocationPrice && (
                  <button
                    onClick={refetchLocationPrice}
                    className="w-full py-[0.8125rem] px-7 mb-4 border-none rounded-[0.625rem] text-[0.8125rem] font-semibold font-rajdhani tracking-[0.0312rem] cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] uppercase text-white shadow-[0_0.25rem_0.75rem_rgba(72,158,70,0.2)] hover:shadow-[0_0.5rem_1.25rem_rgba(72,158,70,0.3)] hover:-translate-y-[2px] cta-shimmer" style={{ background: 'linear-gradient(135deg, #489E46 0%, #3a8039 100%)' }}
                  >
                    Retry Price Calculation
                  </button>
                )}

                <ul className="grid gap-[0.6rem] list-none p-0 mb-4">
                  <li className="flex items-center gap-2 text-[#1a1a1a] text-[0.9rem]"><span className="text-gem font-extrabold">✓</span>Compare location to database</li>
                  <li className="flex items-center gap-2 text-[#1a1a1a] text-[0.9rem]"><span className="text-gem font-extrabold">✓</span>Detailed demographic analysis</li>
                  <li className="flex items-center gap-2 text-[#1a1a1a] text-[0.9rem]"><span className="text-gem font-extrabold">✓</span>Competitive insights</li>
                  <li className="flex items-center gap-2 text-[#1a1a1a] text-[0.9rem]"><span className="text-gem font-extrabold">✓</span>Instant recommendations</li>
                </ul>
                <button className="w-full py-[0.8125rem] px-7 my-4 border-none rounded-[0.625rem] text-[0.8125rem] font-semibold font-rajdhani tracking-[0.0312rem] cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] uppercase text-white shadow-[0_0.25rem_0.75rem_rgba(125,0,184,0.2)] hover:shadow-[0_0.5rem_1.25rem_rgba(125,0,184,0.3)] hover:-translate-y-[2px] cta-shimmer" style={{ background: 'linear-gradient(135deg, #7D00B8 0%, #7E22CE 100%)' }}>Purchase Report</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // First time users - show single free card
    return (
      <div className="font-sans text-[#1a1a1a] pt-6 px-5 pb-0 overflow-x-hidden min-h-full">
        <div className="max-w-[62.5rem] mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-[#1a1a1a]">Location Analysis Report</h2>
            <p className="text-[#666] text-[0.95rem] mt-2">Instant analysis comparing your location to our database</p>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] gap-4">
            <div className="relative border-2 border-[rgba(72,158,70,0.35)] rounded-2xl p-6 bg-white shadow-[0_0.25rem_1rem_rgba(0,0,0,0.05)] transition-all duration-[250ms] ease-in-out hover:-translate-y-[3px] hover:shadow-[0_0.5rem_1.5rem_rgba(0,0,0,0.08)]" style={{ background: 'linear-gradient(120deg, rgba(72,158,70,0.12), #fff)' }}>
              <span className="absolute top-4 right-4 bg-brand-green text-white py-[0.35rem] px-[0.85rem] rounded-full text-xs font-bold tracking-[0.03em]">First Report</span>
              <div className="text-[2rem] font-extrabold text-brand-green mb-[0.35rem]">{priceDisplay}</div>
              <div className="text-[#666] mb-3 font-semibold">Single Location</div>
              <p className="text-[#666] text-[0.95rem] mb-4 leading-relaxed">
                {isLoadingLocationPrice
                  ? 'Calculating price...'
                  : locationReportPrice === null
                  ? 'Unable to calculate price at this time. Please retry to continue.'
                  : isFree
                  ? 'Instant analysis comparing your location to our database. Perfect for your first report.'
                  : `Get detailed analysis of your specific location for ${priceDisplay}`}
              </p>

              {locationReportPrice === null && !isLoadingLocationPrice && (
                <button
                  onClick={refetchLocationPrice}
                  className="w-full py-[0.8125rem] px-7 mb-4 border-none rounded-[0.625rem] text-[0.8125rem] font-semibold font-rajdhani tracking-[0.0312rem] cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] uppercase text-white shadow-[0_0.25rem_0.75rem_rgba(72,158,70,0.2)] hover:shadow-[0_0.5rem_1.25rem_rgba(72,158,70,0.3)] hover:-translate-y-[2px] cta-shimmer" style={{ background: 'linear-gradient(135deg, #489E46 0%, #3a8039 100%)' }}
                >
                  Retry Price Calculation
                </button>
              )}

              <ul className="grid gap-[0.6rem] list-none p-0 mb-4">
                <li className="flex items-center gap-2 text-[#1a1a1a] text-[0.9rem]"><span className="text-brand-green font-extrabold">✓</span>Compare your location to existing database</li>
                <li className="flex items-center gap-2 text-[#1a1a1a] text-[0.9rem]"><span className="text-brand-green font-extrabold">✓</span>Detailed demographic and competitive analysis</li>
                <li className="flex items-center gap-2 text-[#1a1a1a] text-[0.9rem]"><span className="text-brand-green font-extrabold">✓</span>Instant insights and recommendations</li>
              </ul>
              <button className="w-full py-[0.8125rem] px-7 my-4 border-none rounded-[0.625rem] text-[0.8125rem] font-semibold font-rajdhani tracking-[0.0312rem] cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] uppercase text-white shadow-[0_0.25rem_0.75rem_rgba(72,158,70,0.2)] hover:shadow-[0_0.5rem_1.25rem_rgba(72,158,70,0.3)] hover:-translate-y-[2px] cta-shimmer" style={{ background: 'linear-gradient(135deg, #489E46 0%, #3a8039 100%)' }}>Claim Free Report</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For full reports, use card-based pricing design matching tier_pricing.html
  return (
    <div className="font-sans text-[#1a1a1a] pt-6 px-5 pb-0 overflow-x-hidden min-h-full">
      <div className="max-w-[62.5rem] mx-auto">
        {isLoadingPrices && (
          <div className="text-center mb-4">
            <p className="text-xs text-gray-500 flex items-center justify-center">
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
          </div>
        )}

        <div className="grid grid-cols-[repeat(auto-fit,minmax(18.75rem,1fr))] gap-7 mb-[3.75rem] max-md:grid-cols-1 max-md:gap-5">
          {/* Basic Tier */}
          <div
            className={`relative bg-white border-2 rounded-2xl py-5 px-7 flex flex-col overflow-hidden shadow-[0_0.125rem_0.5rem_rgba(0,0,0,0.04)] cursor-pointer pricing-card-basic-glow transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-[#d8d8d8] hover:shadow-[0_0.5rem_1.5rem_rgba(0,0,0,0.08)] hover:-translate-y-1 ${currentTier === 'basic' ? 'border-[3px] border-[rgba(72,158,70,0.7)] shadow-[0_0.5rem_1.5rem_rgba(72,158,70,0.25)]' : 'border-[rgba(72,158,70,0.45)] shadow-[0_0.4rem_1.2rem_rgba(72,158,70,0.12)]'} ${disabled || !tierAvailability.basic ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
            style={{ animationDelay: '0.1s' }}
            role="button"
            tabIndex={0}
            onClick={() => !disabled && tierAvailability.basic && onInputChange('report_tier', 'basic')}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !disabled && tierAvailability.basic) {
                e.preventDefault();
                onInputChange('report_tier', 'basic');
              }
            }}
          >
            <div className="mb-6">
              <div className="font-rajdhani text-[1.375rem] font-bold mb-2 text-[#1a1a1a] max-md:text-xl max-[30rem]:text-lg">Basic</div>
              <div className="text-[0.8125rem] text-[#666] leading-relaxed">
                Perfect for individual location research
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-baseline justify-center gap-1 mb-1">
                <span className="text-lg text-[#666] font-semibold">$</span>
                <span className="font-rajdhani text-[2.625rem] font-bold bg-clip-text text-transparent max-md:text-[2.25rem] max-[30rem]:text-[2rem]" style={{ backgroundImage: 'linear-gradient(135deg, #489E46 0%, #42dc56 100%)' }}>{getPriceNumber(tierPrices.basic)}</span>
              </div>
              <div className="text-[0.8125rem] text-[#666]">per report</div>
            </div>

            <div className="my-5 mx-0 p-[0.9rem_1rem] rounded-[0.875rem] border border-[rgba(72,158,70,0.25)] shadow-[inset_0_0.5rem_1.4rem_rgba(72,158,70,0.08)]" style={{ background: 'linear-gradient(135deg, rgba(72,158,70,0.14) 0%, rgba(255,255,255,0.95) 65%)' }}>
              <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                <div className="inline-flex items-center gap-[0.375rem] text-[0.6875rem] font-bold text-brand-green uppercase tracking-[0.0625rem] font-rajdhani max-[30rem]:text-[0.625rem]">
                  <FaBrain className="text-sm" />
                  Area Intelligence
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="inline-flex flex-col items-start gap-1 w-full bg-[rgba(72,158,70,0.12)] border border-[rgba(72,158,70,0.35)] text-brand-green py-[0.3125rem] px-[0.625rem] rounded-lg transition-all duration-300 min-h-[2.25rem] col-span-2 justify-self-center max-w-[12rem] hover:bg-[rgba(72,158,70,0.16)] hover:border-[rgba(72,158,70,0.5)]">
                  <FaUsers className="text-[0.9rem]" />
                  <div>
                    <div className="text-xs font-semibold whitespace-nowrap">Population</div>
                    <span className="block text-[0.625rem] text-[#666] leading-tight ml-1">Smart population data</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              className={`w-full py-[0.8125rem] px-7 my-4 border-none rounded-[0.625rem] text-[0.8125rem] font-semibold font-rajdhani tracking-[0.0312rem] cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] uppercase cta-shimmer max-md:py-3 max-md:px-5 max-md:text-xs ${currentTier === 'basic' ? 'text-white shadow-[0_0.25rem_0.75rem_rgba(72,158,70,0.2)] hover:shadow-[0_0.5rem_1.25rem_rgba(72,158,70,0.3)] hover:-translate-y-[2px]' : 'bg-transparent text-brand-green border-2 border-[#e8e8e8] hover:border-brand-green hover:bg-[rgba(72,158,70,0.05)]'}`}
              style={currentTier === 'basic' ? { background: 'linear-gradient(135deg, #489E46 0%, #3a8039 100%)' } : undefined}
              onClick={(e) => {
                e.stopPropagation();
                if (!disabled && tierAvailability.basic) {
                  onInputChange('report_tier', 'basic');
                }
              }}
              disabled={disabled || !tierAvailability.basic}
            >
              Get Basic Report
            </button>

            <div className="mb-2 flex-grow">
              <div className="mb-5">
                <div className="text-[0.6875rem] font-bold text-brand-green uppercase tracking-[0.0312rem] mb-[0.625rem] font-rajdhani max-[30rem]:text-[0.625rem]">Core Features</div>
                <div className="flex items-center gap-[0.625rem] py-2 text-[0.8125rem] text-[#666] transition-colors duration-300 hover:text-[#1a1a1a] max-[30rem]:text-xs">
                  <div className="w-[1.125rem] h-[1.125rem] rounded-full flex items-center justify-center shrink-0 text-[0.6875rem] text-white font-bold" style={{ background: 'linear-gradient(135deg, #489E46, #42dc56)' }}>✓</div>
                  <span>Top <strong>10</strong> Locations Ranked</span>
                </div>
                <div className="flex items-center gap-[0.625rem] py-2 text-[0.8125rem] text-[#666] transition-colors duration-300 hover:text-[#1a1a1a] max-[30rem]:text-xs">
                  <div className="w-[1.125rem] h-[1.125rem] rounded-full flex items-center justify-center shrink-0 text-[0.6875rem] text-white font-bold" style={{ background: 'linear-gradient(135deg, #489E46, #42dc56)' }}>✓</div>
                  <span>Preset Scoring Model</span>
                </div>
                <div className="flex items-center gap-[0.625rem] py-2 text-[0.8125rem] text-[#666] transition-colors duration-300 hover:text-[#1a1a1a] max-[30rem]:text-xs">
                  <div className="w-[1.125rem] h-[1.125rem] rounded-full flex items-center justify-center shrink-0 text-[0.6875rem] text-white font-bold" style={{ background: 'linear-gradient(135deg, #489E46, #42dc56)' }}>✓</div>
                  <span>Up to <strong>5</strong> <abbr title="Points Of Interest">POI</abbr> Datasets</span>
                </div>
                <div className="flex items-center gap-[0.625rem] py-2 text-[0.8125rem] text-[#666] transition-colors duration-300 hover:text-[#1a1a1a] max-[30rem]:text-xs">
                  <div className="w-[1.125rem] h-[1.125rem] rounded-full flex items-center justify-center shrink-0 text-[0.6875rem] text-white font-bold" style={{ background: 'linear-gradient(135deg, #489E46, #42dc56)' }}>✓</div>
                  <span>Full Data Access</span>
                </div>
              </div>
            </div>
          </div>

          {/* Standard Tier */}
          <div
            className={`relative bg-white border-2 rounded-2xl pt-10 pb-5 px-7 flex flex-col overflow-visible shadow-[0_0.125rem_0.5rem_rgba(0,0,0,0.04)] cursor-pointer pricing-card-standard-glow transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:shadow-[0_0.75rem_2rem_rgba(125,0,184,0.16)] hover:-translate-y-1 ${currentTier === 'standard' ? 'border-[3px] border-[rgba(125,0,184,0.7)] shadow-[0_0.5rem_1.5rem_rgba(125,0,184,0.25)]' : 'border-gem shadow-[0_0.5rem_1.5rem_rgba(125,0,184,0.12)]'} ${disabled || !tierAvailability.standard ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
            style={{ animationDelay: '0.2s', background: 'linear-gradient(135deg, rgba(125,0,184,0.02) 0%, rgba(72,158,70,0.02) 100%)' }}
            role="button"
            tabIndex={0}
            onClick={() => !disabled && tierAvailability.standard && onInputChange('report_tier', 'standard')}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !disabled && tierAvailability.standard) {
                e.preventDefault();
                onInputChange('report_tier', 'standard');
              }
            }}
          >
            <div className="absolute -top-3 right-5 inline-flex items-center gap-[0.375rem] text-white py-[0.375rem] px-4 rounded-xl text-[0.6875rem] font-bold font-rajdhani tracking-[0.0312rem] shadow-[0_0.25rem_0.75rem_rgba(125,0,184,0.25)] z-10 max-md:absolute max-md:-top-[0.6rem] max-md:right-[0.9rem] max-md:py-[0.3125rem] max-md:px-3 max-md:text-[0.625rem]" style={{ background: 'linear-gradient(135deg, #7D00B8 0%, #7E22CE 100%)' }}>
              <FaStar className="text-xs" />
              MOST POPULAR
            </div>
            <div className="mb-6">
              <div className="font-rajdhani text-[1.375rem] font-bold mb-2 text-[#1a1a1a] max-md:text-xl max-[30rem]:text-lg">Standard</div>
              <div className="text-[0.8125rem] text-[#666] leading-relaxed">
                For growing teams and enterprises
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-baseline justify-center gap-1 mb-1">
                <span className="text-lg text-[#666] font-semibold">$</span>
                <span className="font-rajdhani text-[2.625rem] font-bold bg-clip-text text-transparent max-md:text-[2.25rem] max-[30rem]:text-[2rem]" style={{ backgroundImage: 'linear-gradient(135deg, #489E46 0%, #42dc56 100%)' }}>{getPriceNumber(tierPrices.standard)}</span>
              </div>
              <div className="text-[0.8125rem] text-[#666]">per report</div>
            </div>

            <div className="my-5 mx-0 p-[0.9rem_1rem] rounded-[0.875rem] border border-[rgba(72,158,70,0.25)] shadow-[inset_0_0.5rem_1.4rem_rgba(72,158,70,0.08)]" style={{ background: 'linear-gradient(135deg, rgba(72,158,70,0.14) 0%, rgba(255,255,255,0.95) 65%)' }}>
              <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                <div className="inline-flex items-center gap-[0.375rem] text-[0.6875rem] font-bold text-brand-green uppercase tracking-[0.0625rem] font-rajdhani max-[30rem]:text-[0.625rem]">
                  <FaBrain className="text-sm" />
                  Area Intelligence
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="inline-flex flex-col items-start gap-1 w-full bg-[rgba(72,158,70,0.12)] border border-[rgba(72,158,70,0.35)] text-brand-green py-[0.3125rem] px-[0.625rem] rounded-lg transition-all duration-300 min-h-[2.25rem] col-span-2 justify-self-center max-w-[12rem] hover:bg-[rgba(72,158,70,0.16)] hover:border-[rgba(72,158,70,0.5)]">
                  <FaUsers className="text-[0.9rem]" />
                  <div>
                    <div className="text-xs font-semibold whitespace-nowrap">Population</div>
                    <span className="block text-[0.625rem] text-[#666] leading-tight ml-1">Smart population data</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              className={`w-full py-[0.8125rem] px-7 my-4 border-none rounded-[0.625rem] text-[0.8125rem] font-semibold font-rajdhani tracking-[0.0312rem] cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] uppercase cta-shimmer max-md:py-3 max-md:px-5 max-md:text-xs ${currentTier === 'standard' ? 'text-white shadow-[0_0.25rem_0.75rem_rgba(72,158,70,0.2)] hover:shadow-[0_0.5rem_1.25rem_rgba(72,158,70,0.3)] hover:-translate-y-[2px]' : 'bg-transparent text-brand-green border-2 border-[#e8e8e8] hover:border-brand-green hover:bg-[rgba(72,158,70,0.05)]'}`}
              style={currentTier === 'standard' ? { background: 'linear-gradient(135deg, #489E46 0%, #3a8039 100%)' } : undefined}
              onClick={(e) => {
                e.stopPropagation();
                if (!disabled && tierAvailability.standard) {
                  onInputChange('report_tier', 'standard');
                }
              }}
              disabled={disabled || !tierAvailability.standard}
            >
              Get Standard Report
            </button>

            <div className="mb-2 flex-grow">
              <div className="mb-5">
                <div className="text-[0.6875rem] font-bold text-brand-green uppercase tracking-[0.0312rem] mb-[0.625rem] font-rajdhani max-[30rem]:text-[0.625rem]">Core Features</div>
                <div className="flex items-center gap-[0.625rem] py-2 text-[0.8125rem] text-[#666] transition-colors duration-300 hover:text-[#1a1a1a] max-[30rem]:text-xs">
                  <div className="w-[1.125rem] h-[1.125rem] rounded-full flex items-center justify-center shrink-0 text-[0.6875rem] text-white font-bold" style={{ background: 'linear-gradient(135deg, #489E46, #42dc56)' }}>✓</div>
                  <span>Top <strong>10</strong> Locations Ranked</span>
                </div>
                <div className="flex items-center gap-[0.625rem] py-2 text-[0.8125rem] text-[#666] transition-colors duration-300 hover:text-[#1a1a1a] max-[30rem]:text-xs">
                  <div className="w-[1.125rem] h-[1.125rem] rounded-full flex items-center justify-center shrink-0 text-[0.6875rem] text-white font-bold" style={{ background: 'linear-gradient(135deg, #489E46, #42dc56)' }}>✓</div>
                  <span>Custom Scoring Model</span>
                </div>
                <div className="flex items-center gap-[0.625rem] py-2 text-[0.8125rem] text-[#666] transition-colors duration-300 hover:text-[#1a1a1a] max-[30rem]:text-xs">
                  <div className="w-[1.125rem] h-[1.125rem] rounded-full flex items-center justify-center shrink-0 text-[0.6875rem] text-white font-bold" style={{ background: 'linear-gradient(135deg, #489E46, #42dc56)' }}>✓</div>
                  <span>Up to <strong>10</strong> <abbr title="Points Of Interest">POI</abbr> Datasets</span>
                </div>
                <div className="flex items-center gap-[0.625rem] py-2 text-[0.8125rem] text-[#666] transition-colors duration-300 hover:text-[#1a1a1a] max-[30rem]:text-xs">
                  <div className="w-[1.125rem] h-[1.125rem] rounded-full flex items-center justify-center shrink-0 text-[0.6875rem] text-white font-bold" style={{ background: 'linear-gradient(135deg, #489E46, #42dc56)' }}>✓</div>
                  <span>Full Data Access</span>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Tier */}
          <div
            className={`relative border-2 rounded-2xl pt-10 pb-5 px-7 flex flex-col overflow-visible shadow-[0_0.6rem_1.8rem_rgba(125,0,184,0.18)] cursor-pointer pricing-card-featured-glow transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:shadow-[0_0.85rem_2.2rem_rgba(125,0,184,0.22)] hover:-translate-y-1 ${currentTier === 'premium' ? 'border-[3px] border-[rgba(125,0,184,0.7)] shadow-[0_0.5rem_1.5rem_rgba(125,0,184,0.25)]' : 'border-[rgba(125,0,184,0.55)]'} ${disabled || !tierAvailability.premium ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
            style={{ animationDelay: '0.3s', background: 'linear-gradient(135deg, rgba(125,0,184,0.03) 0%, rgba(25,128,42,0.02) 100%)' }}
            role="button"
            tabIndex={0}
            onClick={() => !disabled && tierAvailability.premium && onInputChange('report_tier', 'premium')}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !disabled && tierAvailability.premium) {
                e.preventDefault();
                onInputChange('report_tier', 'premium');
              }
            }}
          >
            <div className="absolute -top-3 right-5 inline-flex items-center gap-[0.375rem] text-white py-[0.375rem] px-[0.9rem] rounded-xl text-[0.6875rem] font-bold font-rajdhani tracking-[0.0312rem] shadow-[0_0.25rem_0.75rem_rgba(125,0,184,0.35),0_0_1.25rem_rgba(125,0,184,0.35)] z-10 max-md:absolute max-md:-top-[0.6rem] max-md:right-[0.9rem] max-md:py-[0.3125rem] max-md:px-[0.7rem] max-md:text-[0.625rem]" style={{ background: 'linear-gradient(135deg, #7D00B8 0%, #7E22CE 100%)' }}>
              <FaChartLine className="text-xs" />
              Highest ROI
            </div>
            <div className="mb-6 featured-header-aura">
              <div className="font-rajdhani text-[1.375rem] font-bold mb-2 text-[#1a1a1a] max-md:text-xl max-[30rem]:text-lg">Premium</div>
              <div className="text-[0.8125rem] text-[#666] leading-relaxed">
                Enterprise-grade intelligence suite
              </div>
            </div>

            <div className="text-center featured-price-aura">
              <div className="flex items-baseline justify-center gap-1 mb-1">
                <span className="text-lg text-[#666] font-semibold">$</span>
                <span className="font-rajdhani text-[2.625rem] font-bold bg-clip-text text-transparent max-md:text-[2.25rem] max-[30rem]:text-[2rem]" style={{ backgroundImage: 'linear-gradient(135deg, #489E46 0%, #42dc56 100%)' }}>{getPriceNumber(tierPrices.premium)}</span>
              </div>
              <div className="text-[0.8125rem] text-[#666]">per report</div>
            </div>

            <div className="my-5 mx-0 p-[0.9rem_1rem] rounded-[0.875rem] border border-[rgba(125,0,184,0.35)] shadow-[inset_0_0.5rem_1.4rem_rgba(125,0,184,0.08)]" style={{ background: 'linear-gradient(135deg, rgba(125,0,184,0.12) 0%, rgba(255,255,255,0.95) 70%)' }}>
              <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                <div className="inline-flex items-center gap-[0.375rem] text-[0.6875rem] font-bold text-gem uppercase tracking-[0.0625rem] font-rajdhani max-[30rem]:text-[0.625rem]">
                  <FaBrain className="text-sm" />
                  Area Intelligence Pack
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="inline-flex flex-col items-start gap-1 w-full bg-[rgba(125,0,184,0.12)] border border-[rgba(125,0,184,0.35)] text-gem py-[0.3125rem] px-[0.625rem] rounded-lg transition-all duration-300 min-h-[2.25rem] hover:bg-[rgba(125,0,184,0.18)] hover:border-[rgba(125,0,184,0.5)]">
                  <FaUsers className="text-[0.9rem]" />
                  <div>
                    <div className="text-xs font-semibold whitespace-nowrap">Population</div>
                    <span className="block text-[0.625rem] text-[rgba(125,0,184,0.7)] leading-tight ml-1">Smart population data</span>
                  </div>
                </div>
                <div className="inline-flex flex-col items-start gap-1 w-full bg-[rgba(125,0,184,0.12)] border border-[rgba(125,0,184,0.35)] text-gem py-[0.3125rem] px-[0.625rem] rounded-lg transition-all duration-300 min-h-[2.25rem] hover:bg-[rgba(125,0,184,0.18)] hover:border-[rgba(125,0,184,0.5)]">
                  <FaDollarSign className="text-[0.9rem]" />
                  <div>
                    <div className="text-xs font-semibold whitespace-nowrap">Income</div>
                    <span className="block text-[0.625rem] text-[rgba(125,0,184,0.7)] leading-tight ml-1">Smart income data</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="w-full py-[0.8125rem] px-7 my-4 border-none rounded-[0.625rem] text-[0.8125rem] font-semibold font-rajdhani tracking-[0.0312rem] cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] uppercase text-white shadow-[0_0.25rem_0.75rem_rgba(125,0,184,0.2)] hover:shadow-[0_0.5rem_1.25rem_rgba(125,0,184,0.3)] hover:-translate-y-[2px] cta-shimmer max-md:py-3 max-md:px-5 max-md:text-xs"
              style={{ background: 'linear-gradient(135deg, #7D00B8 0%, #7E22CE 100%)' }}
              onClick={(e) => {
                e.stopPropagation();
                if (!disabled && tierAvailability.premium) {
                  onInputChange('report_tier', 'premium');
                }
              }}
              disabled={disabled || !tierAvailability.premium}
            >
              Get Premium Report
            </button>

            <div className="mb-2 flex-grow">
              <div className="mb-5">
                <div className="text-[0.6875rem] font-bold text-brand-green uppercase tracking-[0.0312rem] mb-[0.625rem] font-rajdhani max-[30rem]:text-[0.625rem]">Core Features</div>
                <div className="flex items-center gap-[0.625rem] py-2 text-[0.8125rem] text-[#666] transition-colors duration-300 hover:text-[#1a1a1a] max-[30rem]:text-xs">
                  <div className="w-[1.125rem] h-[1.125rem] rounded-full flex items-center justify-center shrink-0 text-[0.6875rem] text-white font-bold" style={{ background: 'linear-gradient(135deg, #7D00B8 0%, #7E22CE 100%)' }}>✓</div>
                  <span>Top <strong>10</strong> Locations Ranked</span>
                </div>
                <div className="flex items-center gap-[0.625rem] py-2 text-[0.8125rem] text-[#666] transition-colors duration-300 hover:text-[#1a1a1a] max-[30rem]:text-xs">
                  <div className="w-[1.125rem] h-[1.125rem] rounded-full flex items-center justify-center shrink-0 text-[0.6875rem] text-white font-bold" style={{ background: 'linear-gradient(135deg, #7D00B8 0%, #7E22CE 100%)' }}>✓</div>
                  <span>Custom Scoring Model</span>
                </div>
                <div className="flex items-center gap-[0.625rem] py-2 text-[0.8125rem] text-[#666] transition-colors duration-300 hover:text-[#1a1a1a] max-[30rem]:text-xs">
                  <div className="w-[1.125rem] h-[1.125rem] rounded-full flex items-center justify-center shrink-0 text-[0.6875rem] text-white font-bold" style={{ background: 'linear-gradient(135deg, #7D00B8 0%, #7E22CE 100%)' }}>✓</div>
                  <span>Up to <strong>15</strong> <abbr title="Points Of Interest">POI</abbr> Datasets</span>
                </div>
                <div className="flex items-center gap-[0.625rem] py-2 text-[0.8125rem] text-[#666] transition-colors duration-300 hover:text-[#1a1a1a] max-[30rem]:text-xs">
                  <div className="w-[1.125rem] h-[1.125rem] rounded-full flex items-center justify-center shrink-0 text-[0.6875rem] text-white font-bold" style={{ background: 'linear-gradient(135deg, #7D00B8 0%, #7E22CE 100%)' }}>✓</div>
                  <span>Full Data Access</span>
                </div>
              </div>

              <div className="mb-5">
                <div className="text-[0.6875rem] font-bold text-brand-green uppercase tracking-[0.0312rem] mb-[0.625rem] font-rajdhani max-[30rem]:text-[0.625rem]">Premium Support</div>
                <div className="flex items-center gap-[0.625rem] py-2 text-[0.8125rem] text-[#666] transition-colors duration-300 hover:text-[#1a1a1a] max-[30rem]:text-xs">
                  <div className="w-[1.125rem] h-[1.125rem] rounded-full flex items-center justify-center shrink-0 text-[0.6875rem] text-white font-bold" style={{ background: 'linear-gradient(135deg, #7D00B8 0%, #7E22CE 100%)' }}>✓</div>
                  <span>Concierge Service</span>
                </div>
                <div className="flex items-center gap-[0.625rem] py-2 text-[0.8125rem] text-[#666] transition-colors duration-300 hover:text-[#1a1a1a] max-[30rem]:text-xs">
                  <div className="w-[1.125rem] h-[1.125rem] rounded-full flex items-center justify-center shrink-0 text-[0.6875rem] text-white font-bold" style={{ background: 'linear-gradient(135deg, #7D00B8 0%, #7E22CE 100%)' }}>✓</div>
                  <span>Personal Business Consultant</span>
                </div>
                <div className="flex items-center gap-[0.625rem] py-2 text-[0.8125rem] text-[#666] transition-colors duration-300 hover:text-[#1a1a1a] max-[30rem]:text-xs">
                  <div className="w-[1.125rem] h-[1.125rem] rounded-full flex items-center justify-center shrink-0 text-[0.6875rem] text-white font-bold" style={{ background: 'linear-gradient(135deg, #7D00B8 0%, #7E22CE 100%)' }}>✓</div>
                  <span>Priority Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportTierStep;