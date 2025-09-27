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
  businessType: string;
  businessConfig?: BusinessTypeConfig | null;
}

export const CurrentLocationStep = ({
  formData,
  errors,
  onLocationSelect,
  businessType,
  businessConfig,
}: CurrentLocationStepProps) => {
  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="text-center mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
          Current Location <span className="text-sm font-normal text-gray-500">(Optional)</span>
        </h3>
        <p className="text-sm text-gray-600">Set your current position for distance calculations</p>
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
          onLocationSelect={onLocationSelect}
          selectedLocation={formData.current_location}
          title="Current Location"
          error={errors.current_location}
        />
      </div>
    </div>
  );
};
