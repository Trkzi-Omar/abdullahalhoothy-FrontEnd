import { useEffect, useState, useCallback } from 'react';
import apiRequest from '../../../services/apiRequest';
import urls from '../../../urls.json';
import { useAuth } from '../../../context/AuthContext';
import { CustomReportData } from '../../../types/allTypesAndInterfaces';

interface ReportTierStepProps {
  formData: CustomReportData;
  onInputChange: (field: string, value: any) => void;
  disabled?: boolean;
}

interface TierPrice {
  basic: number | null;
  standard: number | null;
  premium: number | null;
}

const ReportTierStep = ({
  formData,
  onInputChange,
  disabled = false,
}: ReportTierStepProps) => {
  const { authResponse } = useAuth();
  const [tierPrices, setTierPrices] = useState<TierPrice>({
    basic: null,
    standard: null,
    premium: null,
  });
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);

  // Set default to premium if not already set
  useEffect(() => {
    if (!formData.report_tier) {
      onInputChange('report_tier', 'premium');
    }
  }, [formData.report_tier, onInputChange]);

  // Calculate prices for all tiers
  const calculateTierPrices = useCallback(async () => {
    if (!authResponse?.localId || !formData.city_name || !formData.country_name) {
      return;
    }

    setIsLoadingPrices(true);

    try {
      // Collect all selected datasets from categories
      const allDatasets: string[] = [];
      if (formData.complementary_categories) {
        allDatasets.push(...formData.complementary_categories);
      }
      if (formData.competition_categories) {
        allDatasets.push(...formData.competition_categories);
      }
      if (formData.cross_shopping_categories) {
        allDatasets.push(...formData.cross_shopping_categories);
      }

      // Calculate price for each tier
      const tiers: Array<'basic' | 'standard' | 'premium'> = ['basic', 'standard', 'premium'];
      const pricePromises = tiers.map(async (tier) => {
        try {
          const requestBody = {
            user_id: authResponse.localId,
            country_name: formData.country_name,
            city_name: formData.city_name,
            datasets: allDatasets,
            intelligences: [] as string[],
            displayed_price: 0,
            report: tier,
          };

          const response = await apiRequest({
            url: urls.calculate_cart_cost,
            method: 'POST',
            body: requestBody,
            isAuthRequest: true,
          });

          const totalCost = response?.data?.data?.total_cost || 0;
          return { tier, price: totalCost };
        } catch (error) {
          console.error(`Error calculating price for ${tier} tier:`, error);
          return { tier, price: null };
        }
      });

      const results = await Promise.all(pricePromises);
      const newPrices: TierPrice = {
        basic: null,
        standard: null,
        premium: null,
      };

      results.forEach(({ tier, price }) => {
        newPrices[tier] = price;
      });

      setTierPrices(newPrices);
    } catch (error) {
      console.error('Error calculating tier prices:', error);
    } finally {
      setIsLoadingPrices(false);
    }
  }, [authResponse?.localId, formData.city_name, formData.country_name, formData.complementary_categories, formData.competition_categories, formData.cross_shopping_categories]);

  // Calculate prices when component mounts or when relevant data changes
  useEffect(() => {
    calculateTierPrices();
  }, [calculateTierPrices]);

  // Default to premium if not set
  const currentTier = formData.report_tier || 'premium';

  // Helper function to format price
  const formatPrice = (price: number | null): string => {
    if (price === null) {
      return isLoadingPrices ? '...' : 'N/A';
    }
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  return (
    <div className="space-y-3 animate-fade-in-up">
      <div className="text-center mb-3">
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

      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3">
          {/* Premium Report */}
          <label className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
            currentTier === 'premium'
              ? 'border-primary bg-primary/5 shadow-md'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}>
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
              <div className="flex items-center">
                <div className={`w-4 h-4 border-2 rounded-full mr-3 flex items-center justify-center ${
                  currentTier === 'premium'
                    ? 'border-primary bg-primary'
                    : 'border-gray-300'
                }`}>
                  {currentTier === 'premium' && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Premium Report</div>
                  <div className="text-sm text-gray-600">
                    Includes pharmacy, dentists, hospitals, supermarkets, population intelligence, and income intelligence datasets
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-primary">
                  {formatPrice(tierPrices.premium)}
                </div>
                <div className="text-xs text-gray-500">USD</div>
              </div>
            </div>
          </label>

          {/* Standard Report */}
          <label className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
            currentTier === 'standard'
              ? 'border-primary bg-primary/5 shadow-md'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}>
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
              <div className="flex items-center">
                <div className={`w-4 h-4 border-2 rounded-full mr-3 flex items-center justify-center ${
                  currentTier === 'standard'
                    ? 'border-primary bg-primary'
                    : 'border-gray-300'
                }`}>
                  {currentTier === 'standard' && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Standard Report</div>
                  <div className="text-sm text-gray-600">
                    Includes complementary and cross-shopping categories analysis
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-primary">
                  {formatPrice(tierPrices.standard)}
                </div>
                <div className="text-xs text-gray-500">USD</div>
              </div>
            </div>
          </label>

          {/* Basic Report */}
          <label className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
            currentTier === 'basic'
              ? 'border-primary bg-primary/5 shadow-md'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}>
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
              <div className="flex items-center">
                <div className={`w-4 h-4 border-2 rounded-full mr-3 flex items-center justify-center ${
                  currentTier === 'basic'
                    ? 'border-primary bg-primary'
                    : 'border-gray-300'
                }`}>
                  {currentTier === 'basic' && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Basic Report</div>
                  <div className="text-sm text-gray-600">
                    Core location analysis with your selected business type
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-primary">
                  {formatPrice(tierPrices.basic)}
                </div>
                <div className="text-xs text-gray-500">USD</div>
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default ReportTierStep;