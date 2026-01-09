import { FaChartBar, FaCheck, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import { CustomReportData, FormErrors, MetricKey } from '../../../types/allTypesAndInterfaces';
import { getMetricIcon } from '../utils/metricIcons';
import { BusinessTypeConfig } from '../services/businessMetricsService';

interface EvaluationMetricsStepProps {
  formData: CustomReportData;
  errors: FormErrors;
  onMetricsChange: (metric: MetricKey, value: number) => void;
  businessType: string;
  businessConfig?: BusinessTypeConfig | null;
  disabled?: boolean;
}

interface MetricItemProps {
  metricKey: string;
  value: number;
  onMetricsChange: (metric: MetricKey, value: number) => void;
  businessType: string;
  businessConfig?: BusinessTypeConfig | null;
  disabled?: boolean;
  error?: string;
  className?: string;
}

const MetricItem = ({
  metricKey,
  value,
  onMetricsChange,
  businessType,
  businessConfig,
  disabled = false,
  error,
  className = '',
}: MetricItemProps) => {
  return (
    <div
      className={`bg-white border-2 border-gray-100 rounded-lg p-4 hover:border-primary/30 transition-all duration-200 ${className}`}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label
            htmlFor={`metrics_${metricKey}`}
            className="flex items-center text-sm font-semibold text-gray-700 capitalize"
          >
            <span className="text-primary mr-2">
              {getMetricIcon(metricKey, businessType, businessConfig)}
            </span>
            <span className="mr-1">{metricKey.replace('_', ' ')}</span>
            {businessConfig?.metrics?.[metricKey]?.description && (
              <div className="group relative ml-1">
                <FaInfoCircle className="text-gray-400 hover:text-primary transition-colors cursor-help w-3.5 h-3.5" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900/90 backdrop-blur-sm text-white text-xs font-normal rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 text-center shadow-lg transform translate-y-2 group-hover:translate-y-0 pointer-events-none">
                  {businessConfig.metrics[metricKey].description}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900/90"></div>
                </div>
              </div>
            )}
          </label>
          <span className="text-xl font-bold text-primary">{(value * 100).toFixed(0)}%</span>
        </div>

        <input
          type="range"
          id={`metrics_${metricKey}`}
          value={value}
          onChange={e => onMetricsChange(metricKey as MetricKey, Number(e.target.value))}
          min="0"
          max="1"
          step="0.01"
          disabled={disabled}
          className={`w-full h-2 bg-gray-200 rounded-lg appearance-none slider form-transition ${
            disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
          }`}
          style={{
            background: `linear-gradient(to right, #115740 0%, #115740 ${value * 100}%, #e5e7eb ${value * 100}%, #e5e7eb 100%)`,
          }}
        />

        <div className="relative">
          <input
            type="number"
            value={(value * 100).toFixed(0)}
            onChange={e => onMetricsChange(metricKey as MetricKey, Number(e.target.value) / 100)}
            min="0"
            max="100"
            step="1"
            disabled={disabled}
            className={`w-full px-3 py-2 pr-8 border-2 rounded-lg text-center font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 ${
              disabled
                ? 'bg-gray-100 cursor-not-allowed opacity-60'
                : error
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200'
            }`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold pointer-events-none">
            %
          </span>
        </div>

        {error && (
          <p className="text-sm text-red-600 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export const EvaluationMetricsStep = ({
  formData,
  errors,
  onMetricsChange,
  businessType,
  businessConfig,
  disabled = false,
}: EvaluationMetricsStepProps) => {
  const metricsSum = Object.values(formData.evaluation_metrics).reduce(
    (sum, value) => sum + value,
    0
  );

  // Helper to format display value (e.g. 0.5 -> 50%) if needed, or just keep as decimal
  // User requested "change logic... to 1", implying decimal values.
  // We will display as decimal for consistency with the input.

  const isBalanced = Math.abs(metricsSum - 1) < 0.001; // Use epsilon for float comparison
  const isOver = metricsSum > 1.001;

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="text-center mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Evaluation Metrics</h3>
        <p className="text-sm text-gray-600">
          Set the importance weights for different factors (must total 100%)
        </p>
        <p className="text-xs text-gray-600 w-fit bg-gray-50 mt-1 py-2 px-3 rounded mx-auto">
          your choice of weight indicates how much this factor has an effect on your business
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

      {Object.keys(formData.evaluation_metrics).length === 5 ? (
        <div className="space-y-4">
          {/* First row - 3 items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(formData.evaluation_metrics)
              .slice(0, 3)
              .map(([key, value]) => (
                <MetricItem
                  key={key}
                  metricKey={key}
                  value={value}
                  onMetricsChange={onMetricsChange}
                  businessType={businessType}
                  businessConfig={businessConfig}
                  disabled={disabled}
                  error={errors[`metrics_${key}`]}
                />
              ))}
          </div>

          {/* Second row - 2 items centered */}
          <div className="flex justify-center gap-4">
            {Object.entries(formData.evaluation_metrics)
              .slice(3, 5)
              .map(([key, value]) => (
                <MetricItem
                  key={key}
                  metricKey={key}
                  value={value}
                  onMetricsChange={onMetricsChange}
                  businessType={businessType}
                  businessConfig={businessConfig}
                  disabled={disabled}
                  error={errors[`metrics_${key}`]}
                  className="w-full max-w-sm"
                />
              ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(formData.evaluation_metrics).map(([key, value]) => (
            <MetricItem
              key={key}
              metricKey={key}
              value={value}
              onMetricsChange={onMetricsChange}
              businessType={businessType}
              businessConfig={businessConfig}
              disabled={disabled}
              error={errors[`metrics_${key}`]}
            />
          ))}
        </div>
      )}

      {errors.evaluation_metrics && (
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
            {errors.evaluation_metrics}
          </p>
        </div>
      )}
    </div>
  );
};
