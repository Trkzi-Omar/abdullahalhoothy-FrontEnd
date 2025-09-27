import { FaGlobe, FaMapMarkerAlt, FaBuilding, FaExclamationTriangle } from 'react-icons/fa';
import { CITY_OPTIONS } from '../constants';

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
}

const BasicInformationStep = ({ formData, errors, onInputChange }: BasicInformationStepProps) => {
  return (
    <div className="space-y-3 animate-fade-in-up">
      <div className="text-center mb-3">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Basic Information</h3>
        <p className="text-sm text-gray-600">
          Let's start with the basic details for your pharmacy report
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
          value={formData.Type}
          readOnly
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
        />
      </div>
    </div>
  );
};

export default BasicInformationStep;
