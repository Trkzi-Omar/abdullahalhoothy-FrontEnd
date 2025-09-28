import { FaGlobe, FaMapMarkerAlt, FaBuilding, FaExclamationTriangle } from 'react-icons/fa';
import { CITY_OPTIONS, getBusinessTypeConfig } from '../constants';
import { BusinessTypeConfig } from '../services/businessMetricsService';

interface BasicInformationStepProps {
  formData: {
    country_name: string;
    city_name: string;
    Type: string;
  };
  errors: {
    city_name?: string;
  };
  onInputChange: (field: string, value: any) => void;
  businessConfig?: BusinessTypeConfig | null;
  isAdvancedMode: boolean;
  onToggleAdvancedMode: (enabled: boolean) => void;
}

const BasicInformationStep = ({
  formData,
  errors,
  onInputChange,
  businessConfig,
  isAdvancedMode,
  onToggleAdvancedMode,
}: BasicInformationStepProps) => {
  const config = businessConfig ? getBusinessTypeConfig(businessConfig) : null;

  if (!config) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-3 animate-fade-in-up">
      <div className="text-center mb-3">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Basic Information</h3>
        <p className="text-sm text-gray-600">
          Let's start with the basic details for your {config.displayName.toLowerCase()} report
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Country (readonly) */}
        <div className="space-y-3">
          <label htmlFor="country_name" className="block text-sm font-semibold text-gray-700">
            <span className="flex items-center">
              <FaGlobe className="w-4 h-4 mr-2 text-primary" />
              Country
            </span>
          </label>
          <input
            type="text"
            id="country_name"
            value={formData.country_name}
            readOnly
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
          />
        </div>

        {/* City Selection */}
        <div className="space-y-3">
          <label htmlFor="city_name" className="block text-sm font-semibold text-gray-700">
            <span className="flex items-center">
              <FaMapMarkerAlt className="w-4 h-4 mr-2 text-primary" />
              City
              <span className="text-red-500 ml-1">*</span>
            </span>
          </label>
          <select
            id="city_name"
            value={formData.city_name}
            onChange={e => onInputChange('city_name', e.target.value)}
            className={`w-full px-4 py-3 border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 ${
              errors.city_name
                ? 'border-red-300 bg-red-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {CITY_OPTIONS.map(city => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          {errors.city_name && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <FaExclamationTriangle className="w-4 h-4 mr-1" />
              {errors.city_name}
            </p>
          )}
        </div>
      </div>

      {/* Type (readonly) */}
      <div className="space-y-3">
        <label htmlFor="Type" className="block text-sm font-semibold text-gray-700">
          <span className="flex items-center">
            <FaBuilding className="w-4 h-4 mr-2 text-primary" />
            Report Type
          </span>
        </label>
        <input
          type="text"
          id="Type"
          value={config.displayName}
          readOnly
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
        />
      </div>

      {/* Advanced Configuration Toggle */}
      <div className="border-t border-gray-200 pt-4 mt-6">
        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900 mb-1">Advanced Configuration</h4>
              <p id="advanced-config-description" className="text-xs text-gray-600">
                Customize evaluation metrics, add specific locations, and set your current position
              </p>
            </div>
            <label className="flex items-center cursor-pointer">
              <span className="sr-only">Enable Advanced Configuration</span>
              <button
                type="button"
                onClick={() => onToggleAdvancedMode(!isAdvancedMode)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  isAdvancedMode ? 'bg-primary' : 'bg-gray-300'
                }`}
                aria-label={`${isAdvancedMode ? 'Disable' : 'Enable'} Advanced Configuration`}
                aria-pressed={isAdvancedMode}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${
                    isAdvancedMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          </div>

          {/* Clear action button */}
          <button
            type="button"
            onClick={() => onToggleAdvancedMode(!isAdvancedMode)}
            className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isAdvancedMode
                ? 'bg-primary text-white hover:bg-primary/90 focus:ring-primary/20'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-primary hover:text-primary focus:ring-primary/20'
            }`}
            aria-label={
              isAdvancedMode ? 'Advanced Configuration is enabled' : 'Enable Advanced Configuration'
            }
            aria-describedby="advanced-config-description"
          >
            {isAdvancedMode ? '✓ Advanced Mode Enabled' : 'Enable Advanced Configuration'}
          </button>
        </div>

        {isAdvancedMode && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>Advanced mode enabled:</strong> You'll be able to customize evaluation
              metrics, add custom locations, and set your current position in the following steps.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BasicInformationStep;
