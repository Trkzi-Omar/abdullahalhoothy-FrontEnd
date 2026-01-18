import { FaMapMarkerAlt } from 'react-icons/fa';
import {
  CustomReportData,
  FormErrors,
  CurrentLocation,
} from '../../../types/allTypesAndInterfaces';
import MapLocationPicker from '../../MapLocationPicker/MapLocationPicker';
import { BusinessTypeConfig } from '../services/businessMetricsService';

interface CurrentLocationStepProps {
  formData: CustomReportData;
  errors: FormErrors;
  onLocationSelect: (location: CurrentLocation) => void;
  businessType?: string;
  businessConfig?: BusinessTypeConfig | null;
  disabled?: boolean;
  isRequired?: boolean;
  reportType?: 'full' | 'location';
}

export const CurrentLocationStep = ({
  formData,
  errors,
  onLocationSelect,
  disabled = false,
  isRequired = false,
  reportType,
}: CurrentLocationStepProps) => {
  
  const title = reportType === 'location' ? 'Your Location' : 'Current Location';
  const helpText = reportType === 'location'
    ? "Select the exact location you want to analyze. We'll compare it to our database."
    : 'Set your current position for distance calculations';

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="text-center mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
          {title}
          {isRequired ? (
            <span className="text-red-500 ml-1">*</span>
          ) : (
            <span className="text-sm font-normal text-gray-500 ml-1">(Optional)</span>
          )}
        </h3>
        <p className="text-sm text-gray-600">{helpText}</p>
      </div>

      <div className="bg-white border-2 border-gray-100 rounded-lg p-4 hover:border-primary/30 transition-all duration-200">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
            <FaMapMarkerAlt className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm">Your Current Position</h4>
            <p className="text-xs text-gray-600">
              This will be used as the reference point for distance calculations
            </p>
          </div>
        </div>

        <MapLocationPicker
          city={formData.city_name}
          onLocationSelect={(location) => {
            // MapLocationPicker only returns lat/lng, so we merge with existing properties
            onLocationSelect({
              ...location,
              properties: {
                ...formData.current_location?.properties,
                price: formData.current_location?.properties?.price || 0,
                avg_order_value: formData.current_location?.properties?.avg_order_value || 30,
              },
            });
          }}
          selectedLocation={{
            lat: formData.current_location?.lat || 0,
            lng: formData.current_location?.lng || 0,
          }}
          title="Current Location"
          error={errors.current_location}
        />

        {/* Average Order Value Input */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Average Order Value (SAR)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.current_location?.properties?.avg_order_value || 30}
            onChange={e => {
              const value = parseFloat(e.target.value) || 30;
              onLocationSelect({
                ...formData.current_location,
                properties: {
                  ...formData.current_location?.properties,
                  price: formData.current_location?.properties?.price || 0,
                  avg_order_value: value,
                },
              });
            }}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2"
            placeholder="30"
          />
          <p className="text-xs text-gray-500 mt-1">
            The average price per order in Saudi Riyal.
          </p>
        </div>

        {/* Rent Price Input */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rent Price (SAR)
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={formData.current_location?.properties?.price || ''}
            onChange={e => {
              const value = parseFloat(e.target.value) || 0;
              onLocationSelect({
                ...formData.current_location,
                properties: {
                  ...formData.current_location?.properties,
                  price: value,
                  avg_order_value: formData.current_location?.properties?.avg_order_value || 30,
                },
              });
            }}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Enter rent price"
          />
          <p className="text-xs text-gray-500 mt-1">
            Yearly rent price for this location in Saudi Riyal
          </p>
        </div>
      </div>
    </div>
  );
};

export default CurrentLocationStep;
