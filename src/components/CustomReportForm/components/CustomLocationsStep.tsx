import { FaPlus, FaTrash } from 'react-icons/fa';
import MapLocationPicker from '../../MapLocationPicker/MapLocationPicker';
import { CustomLocation, FormErrors } from '../../../types/allTypesAndInterfaces';
import { getBusinessTypeConfig } from '../constants';
import { BusinessTypeConfig } from '../services/businessMetricsService';

interface CustomLocationsStepProps {
  formData: {
    city_name: string;
    custom_locations: CustomLocation[];
  };
  errors: FormErrors;
  onAddCustomLocation: () => void;
  onRemoveCustomLocation: (index: number) => void;
  onCustomLocationSelect: (index: number, newLocation: { lat: number; lng: number }) => void;
  businessConfig?: BusinessTypeConfig | null;
  disabled?: boolean;
}

const CustomLocationsStep = ({
  formData,
  errors,
  onAddCustomLocation,
  onRemoveCustomLocation,
  onCustomLocationSelect,
  businessConfig,
  disabled = false,
}: CustomLocationsStepProps) => {
  const config = businessConfig ? getBusinessTypeConfig(businessConfig) : null;

  if (!config) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="text-center mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
          Custom Locations <span className="text-sm font-normal text-gray-500">(Optional)</span>
        </h3>
        <p className="text-sm text-gray-600">
          Add specific locations you want to analyze for {config.displayName.toLowerCase()}{' '}
          placement
        </p>
      </div>

      <div className="space-y-4">
        {formData.custom_locations.map((location, index) => (
          <div
            key={index}
            className="bg-white border-2 border-gray-100 rounded-lg p-4 hover:border-primary/30 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                  <span className="text-primary font-bold text-sm">{index + 1}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">Location {index + 1}</h4>
                  <p className="text-xs text-gray-600">Select a specific area to analyze</p>
                </div>
              </div>
              {formData.custom_locations.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveCustomLocation(index)}
                  disabled={disabled}
                  className={`flex items-center px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 ${
                    disabled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  <FaTrash className="w-3 h-3 mr-1" />
                  Remove
                </button>
              )}
            </div>

            <MapLocationPicker
              city={formData.city_name}
              onLocationSelect={newLocation => onCustomLocationSelect(index, newLocation)}
              selectedLocation={location}
              title={`Custom Location ${index + 1}`}
              error={errors[`custom_location_${index}`]}
            />
          </div>
        ))}

        <button
          type="button"
          onClick={onAddCustomLocation}
          disabled={disabled}
          className={`w-full flex items-center justify-center px-4 py-3 border-2 border-dashed rounded-lg transition-all duration-200 group ${
            disabled
              ? 'border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
              : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary'
          }`}
        >
          <FaPlus className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
          Add Another Location
        </button>
      </div>
    </div>
  );
};

export default CustomLocationsStep;
