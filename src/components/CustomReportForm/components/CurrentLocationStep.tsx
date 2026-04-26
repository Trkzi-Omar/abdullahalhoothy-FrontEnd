import { FaMapMarkerAlt } from 'react-icons/fa';
import {
  CustomReportData,
  FormErrors,
  CurrentLocation,
} from '../../../types/allTypesAndInterfaces';
import MapLocationPicker from '../../MapLocationPicker/MapLocationPicker';
import { BusinessTypeConfig } from '../services/businessMetricsService';
import { t } from '../../../i18n';


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
  const title = reportType === 'location' ? t("your-location") : t("current-location");
  const helpText =
    reportType === 'location'
      ? t("select-the-exact-location-you-want-to-analyze-we-ll-compare-it-to-our-database")
      : t("set-your-current-position-for-distance-calculations");

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="text-center mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
          {title}
          {isRequired ? (
            <span className="text-red-500 ms-1">*</span>
          ) : (
            <span className="text-sm font-normal text-gray-500 ms-1">{t("optional")}</span>
          )}
        </h3>
        <p className="text-sm text-gray-600">{helpText}</p>
      </div>

      <div className="bg-white border-2 border-gray-100 rounded-lg p-4 hover:border-primary/30 transition-all duration-200">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center me-3">
            <FaMapMarkerAlt className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm">{t("your-current-position")}</h4>
            <p className="text-xs text-gray-600">{t("this-will-be-used-as-the-reference-point-for-distance-calculations")}</p>
          </div>
        </div>

        <MapLocationPicker
          city={formData.city_name}
          onChange={location => {
            onLocationSelect({
              lat: location.lat ?? formData.current_location?.lat ?? 0,
              lng: location.lng ?? formData.current_location?.lng ?? 0,
              properties: {
                ...formData.current_location?.properties,
                price: location.price ?? formData.current_location?.properties?.price ?? 0,
                avg_order_value: formData.current_location?.properties?.avg_order_value ?? 30,
              },
            });
          }}
          selectedLocation={{
            lat: formData.current_location?.lat || 0,
            lng: formData.current_location?.lng || 0,
          }}
          title={t("current-location")}
          error={errors.current_location}
        />

        <div className="mt-4 flex flex-col sm:flex-row gap-5">
          {/* Average Order Value Input */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t("average-order-value-sar")}</label>
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
            <p className="text-xs text-gray-500 mt-1">{t("the-average-price-per-order-in-saudi-riyal")}</p>
          </div>

          {/* Rent Price Input */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t("rent-price-sar")}</label>
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
              placeholder={t("enter-rent-price")}
            />
            <p className="text-xs text-gray-500 mt-1">{t("yearly-rent-price-for-this-location-in-saudi-riyal")}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentLocationStep;
