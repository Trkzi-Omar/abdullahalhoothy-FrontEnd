import { FaExclamationTriangle, FaStore, FaTruck } from 'react-icons/fa';
import { CustomReportData, FormErrors } from '../../../types/allTypesAndInterfaces';
import '../DeliveryStore.css';

interface DeliveryInStoreStepProps {
  formData: CustomReportData;
  errors: FormErrors;
  onInputChange: (field: string, value: any) => void;
  disabled?: boolean;
}

export const DeliveryInStoreStep = ({
  formData,
  errors,
  onInputChange,
  disabled = false,
}: DeliveryInStoreStepProps) => {
  const deliveryWeight = formData.delivery_weight ?? 0.5;
  const dineInWeight = 1 - deliveryWeight;

  // Colors
  const deliveryColor = '#115740'; // Primary Green
  const inStoreColor = '#7D00B8'; // Purple

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    onInputChange('delivery_weight', val);
    // Ensure accurate floating point math for the complement
    onInputChange('dine_in_weight', Number((1 - val).toFixed(2)));
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Delivery vs In-Store</h3>
        <p className="text-gray-600">
          How do you expect your revenue to be split between delivery and in-store sales?
        </p>
      </div>

      <div className="bg-white border text-center border-gray-200 rounded-xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
        {/* Metric Values Display */}
        <div className="flex justify-between items-end mb-10">
          <div className="flex flex-col items-start space-y-2 group">
            <div
              className={`flex items-center gap-2 p-2 rounded-lg transition-colors duration-200 ${
                deliveryWeight > 0.5 ? 'bg-primary/10 text-primary' : 'bg-gray-50 text-gray-500'
              }`}
            >
              <FaTruck className="w-5 h-5" />
              <span className="font-bold text-sm">Delivery</span>
            </div>
            <span
              className="text-5xl font-extrabold transition-all duration-200"
              style={{ color: deliveryColor }}
            >
              {(deliveryWeight * 100).toFixed(0)}%
            </span>
          </div>

          <div className="flex flex-col items-end space-y-2 group">
            <div
              className={`flex items-center gap-2 p-2 rounded-lg transition-colors duration-200 ${
                dineInWeight > 0.5 ? 'bg-amber-100 text-amber-600' : 'bg-gray-50 text-gray-500'
              }`}
            >
              <span className="font-bold text-sm">In-Store</span>
              <FaStore className="w-5 h-5" />
            </div>
            <span
              className="text-5xl font-extrabold transition-all duration-200"
              style={{ color: inStoreColor }}
            >
              {(dineInWeight * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Custom Range Slider Container */}
        <div className="relative h-14 flex items-center mb-2 px-2">
          {/* Track Background Visuals - Optional Markers */}
          <div className="absolute left-0 right-0 h-2 bg-gray-100 rounded-full overflow-hidden pointer-events-none"></div>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={deliveryWeight}
            onChange={handleSliderChange}
            disabled={disabled}
            className={`custom-slider w-full absolute z-10 appearance-none bg-transparent focus:outline-none transition-all duration-200 ${
              disabled ? 'opacity-60 cursor-not-allowed' : ''
            }`}
            style={{
              // @ts-ignore - Custom property for track gradient
              background: `linear-gradient(to right, ${deliveryColor} 0%, ${deliveryColor} ${
                deliveryWeight * 100
              }%, ${inStoreColor} ${deliveryWeight * 100}%, ${inStoreColor} 100%)`,
              height: '10px',
              borderRadius: '9999px',
            }}
          />
        </div>

        <div className="flex justify-between text-xs font-bold text-gray-400 px-1 uppercase tracking-widest mt-2">
          <span
            className="transition-colors duration-200"
            style={{ color: deliveryWeight > 0.5 ? deliveryColor : undefined }}
          >
            More Delivery
          </span>
          <span
            className="transition-colors duration-200"
            style={{ color: dineInWeight > 0.5 ? inStoreColor : undefined }}
          >
            More In-Store
          </span>
        </div>
      </div>

      {/* Error container */}
      {(errors.delivery_weight || errors.dine_in_weight) && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl animate-fade-in">
          <p className="text-sm font-medium flex items-center">
            <FaExclamationTriangle className="w-4 h-4 mr-2" />
            {errors.delivery_weight || errors.dine_in_weight}
          </p>
        </div>
      )}
    </div>
  );
};

export default DeliveryInStoreStep;
