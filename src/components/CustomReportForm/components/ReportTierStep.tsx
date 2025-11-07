import { useEffect } from 'react';

interface ReportTierStepProps {
  formData: {
    report_tier?: string;
  };
  onInputChange: (field: string, value: any) => void;
  disabled?: boolean;
}

const ReportTierStep = ({
  formData,
  onInputChange,
  disabled = false,
}: ReportTierStepProps) => {
  // Set default to premium if not already set
  useEffect(() => {
    if (!formData.report_tier) {
      onInputChange('report_tier', 'premium');
    }
  }, [formData.report_tier, onInputChange]);

  // Default to premium if not set
  const currentTier = formData.report_tier || 'premium';
  return (
    <div className="space-y-3 animate-fade-in-up">
      <div className="text-center mb-3">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Choose Report Tier</h3>
        <p className="text-sm text-gray-600">
          Select the level of detail and datasets you want in your report
        </p>
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
                <div className="text-lg font-bold text-primary">$1,999</div>
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
                <div className="text-lg font-bold text-primary">$1,849</div>
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
                <div className="text-lg font-bold text-primary">$1,559</div>
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