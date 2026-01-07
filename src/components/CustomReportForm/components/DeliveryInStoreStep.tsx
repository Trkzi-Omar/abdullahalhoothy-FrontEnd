import { FaChartBar, FaCheck, FaExclamationTriangle, FaStore, FaTruck } from 'react-icons/fa';
import { CustomReportData, FormErrors } from '../../../types/allTypesAndInterfaces';

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
  const dineInWeight = formData.dine_in_weight ?? 0.5;
  const metricsSum = deliveryWeight + dineInWeight;

  const isBalanced = Math.abs(metricsSum - 1) < 0.001;
  const isOver = metricsSum > 1.001;

  const metrics = [
    {
      key: 'delivery_weight',
      label: 'Delivery',
      value: deliveryWeight,
      icon: <FaTruck className="w-4 h-4" />,
    },
    {
      key: 'dine_in_weight',
      label: 'In-Store',
      value: dineInWeight,
      icon: <FaStore className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="text-center mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Delivery vs In-Store</h3>
        <p className="text-sm text-gray-600">
          Set the importance weights for delivery and in-store operations (must total 100%)
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <FaChartBar className="w-5 h-5 text-primary mr-2" />
            <span className="text-base font-semibold text-gray-900">Total Weight</span>
          </div>
          <div
            className={`flex items-center px-3 py-1.5 rounded-full ${
              isBalanced
                ? 'bg-green-100 text-green-800'
                : isOver
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            <span className="text-lg font-bold mr-1">{(metricsSum * 100).toFixed(0)}%</span>
            {isBalanced ? (
              <FaCheck className="w-4 h-4" />
            ) : (
              <FaExclamationTriangle className="w-4 h-4" />
            )}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full progress-bar ${
              isBalanced ? 'bg-green-500' : isOver ? 'bg-red-500' : 'bg-yellow-500'
            }`}
            style={{ width: `${Math.min(metricsSum * 100, 100)}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2 text-center">
          {isBalanced
            ? 'Perfect! All weights are balanced.'
            : isOver
              ? 'Total exceeds 100%. Please reduce some values.'
              : `${((1 - metricsSum) * 100).toFixed(0)}% remaining to reach 100%`}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {metrics.map(metric => (
          <div
            key={metric.key}
            className="bg-white border-2 border-gray-100 rounded-lg p-4 hover:border-primary/30 transition-all duration-200"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label
                  htmlFor={metric.key}
                  className="flex items-center text-sm font-semibold text-gray-700 capitalize"
                >
                  <span className="text-primary mr-2">{metric.icon}</span>
                  {metric.label}
                </label>
                <span className="text-xl font-bold text-primary">
                  {(metric.value * 100).toFixed(0)}%
                </span>
              </div>

              <input
                type="range"
                id={metric.key}
                value={metric.value}
                onChange={e => onInputChange(metric.key, Number(e.target.value))}
                min="0"
                max="1"
                step="0.01"
                disabled={disabled}
                className={`w-full h-2 bg-gray-200 rounded-lg appearance-none slider form-transition ${
                  disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                }`}
                style={{
                  background: `linear-gradient(to right, #115740 0%, #115740 ${metric.value * 100}%, #e5e7eb ${metric.value * 100}%, #e5e7eb 100%)`,
                }}
              />

              <div className="relative">
                <input
                  type="number"
                  value={(metric.value * 100).toFixed(0)}
                  onChange={e => onInputChange(metric.key, Number(e.target.value) / 100)}
                  min="0"
                  max="100"
                  step="1"
                  disabled={disabled}
                  className={`w-full px-3 py-2 pr-8 border-2 rounded-lg text-center font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 ${
                    disabled
                      ? 'bg-gray-100 cursor-not-allowed opacity-60'
                      : errors[metric.key]
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200'
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold pointer-events-none">
                  %
                </span>
              </div>

              {errors[metric.key] && (
                <p className="text-sm text-red-600 flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {errors[metric.key]}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {(errors.delivery_weight || errors.dine_in_weight) &&
        !errors.delivery_weight?.includes('cannot be negative') && ( // Generic error container
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
            <p className="text-sm font-medium flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Totals must equal 100%
            </p>
          </div>
        )}
    </div>
  );
};

export default DeliveryInStoreStep;
