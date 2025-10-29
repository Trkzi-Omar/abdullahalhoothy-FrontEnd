import { FaChartBar, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
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

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="text-center mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Evaluation Metrics</h3>
        <p className="text-sm text-gray-600">
          Set the importance weights for different factors (must total 100%)
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
              metricsSum === 100
                ? 'bg-green-100 text-green-800'
                : metricsSum > 100
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            <span className="text-lg font-bold mr-1">{metricsSum}%</span>
            {metricsSum === 100 ? (
              <FaCheck className="w-4 h-4" />
            ) : (
              <FaExclamationTriangle className="w-4 h-4" />
            )}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full progress-bar ${
              metricsSum === 100
                ? 'bg-green-500'
                : metricsSum > 100
                  ? 'bg-red-500'
                  : 'bg-yellow-500'
            }`}
            style={{ width: `${Math.min(metricsSum, 100)}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2 text-center">
          {metricsSum === 100
            ? 'Perfect! All weights are balanced.'
            : metricsSum > 100
              ? 'Total exceeds 100%. Please reduce some values.'
              : `${100 - metricsSum}% remaining to reach 100%`}
        </p>
      </div>

      {Object.keys(formData.evaluation_metrics).length === 5 ? (
        <div className="space-y-4">
          {/* First row - 3 items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(formData.evaluation_metrics)
              .slice(0, 3)
              .map(([key, value]) => (
                <div
                  key={key}
                  className="bg-white border-2 border-gray-100 rounded-lg p-4 hover:border-primary/30 transition-all duration-200"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor={`metrics_${key}`}
                        className="flex items-center text-sm font-semibold text-gray-700 capitalize"
                      >
                        <span className="text-primary mr-2">
                          {getMetricIcon(key, businessType, businessConfig)}
                        </span>
                        {key.replace('_', ' ')}
                      </label>
                      <span className="text-xl font-bold text-primary">{value}%</span>
                    </div>

                    <input
                      type="range"
                      id={`metrics_${key}`}
                      value={value}
                      onChange={e => onMetricsChange(key as MetricKey, Number(e.target.value))}
                      min="0"
                      max="100"
                      disabled={disabled}
                      className={`w-full h-2 bg-gray-200 rounded-lg appearance-none slider form-transition ${
                        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                      }`}
                      style={{
                        background: `linear-gradient(to right, #115740 0%, #115740 ${value}%, #e5e7eb ${value}%, #e5e7eb 100%)`,
                      }}
                    />

                    <input
                      type="number"
                      value={value}
                      onChange={e => onMetricsChange(key as MetricKey, Number(e.target.value))}
                      min="0"
                      max="100"
                      disabled={disabled}
                      className={`w-full px-3 py-2 border-2 rounded-lg text-center font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 ${
                        disabled
                          ? 'bg-gray-100 cursor-not-allowed opacity-60'
                          : errors[`metrics_${key}`]
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-200'
                      }`}
                    />

                    {errors[`metrics_${key}`] && (
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
                        {errors[`metrics_${key}`]}
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </div>

          {/* Second row - 2 items centered */}
          <div className="flex justify-center gap-4">
            {Object.entries(formData.evaluation_metrics)
              .slice(3, 5)
              .map(([key, value]) => (
                <div
                  key={key}
                  className="bg-white border-2 border-gray-100 rounded-lg p-4 hover:border-primary/30 transition-all duration-200 w-full max-w-sm"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor={`metrics_${key}`}
                        className="flex items-center text-sm font-semibold text-gray-700 capitalize"
                      >
                        <span className="text-primary mr-2">
                          {getMetricIcon(key, businessType, businessConfig)}
                        </span>
                        {key.replace('_', ' ')}
                      </label>
                      <span className="text-xl font-bold text-primary">{value}%</span>
                    </div>

                    <input
                      type="range"
                      id={`metrics_${key}`}
                      value={value}
                      onChange={e => onMetricsChange(key as MetricKey, Number(e.target.value))}
                      min="0"
                      max="100"
                      disabled={disabled}
                      className={`w-full h-2 bg-gray-200 rounded-lg appearance-none slider form-transition ${
                        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                      }`}
                      style={{
                        background: `linear-gradient(to right, #115740 0%, #115740 ${value}%, #e5e7eb ${value}%, #e5e7eb 100%)`,
                      }}
                    />

                    <input
                      type="number"
                      value={value}
                      onChange={e => onMetricsChange(key as MetricKey, Number(e.target.value))}
                      min="0"
                      max="100"
                      disabled={disabled}
                      className={`w-full px-3 py-2 border-2 rounded-lg text-center font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 ${
                        disabled
                          ? 'bg-gray-100 cursor-not-allowed opacity-60'
                          : errors[`metrics_${key}`]
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-200'
                      }`}
                    />

                    {errors[`metrics_${key}`] && (
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
                        {errors[`metrics_${key}`]}
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(formData.evaluation_metrics).map(([key, value]) => (
            <div
              key={key}
              className="bg-white border-2 border-gray-100 rounded-lg p-4 hover:border-primary/30 transition-all duration-200"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor={`metrics_${key}`}
                    className="flex items-center text-sm font-semibold text-gray-700 capitalize"
                  >
                    <span className="text-primary mr-2">
                      {getMetricIcon(key, businessType, businessConfig)}
                    </span>
                    {key.replace('_', ' ')}
                  </label>
                  <span className="text-xl font-bold text-primary">{value}%</span>
                </div>

                <input
                  type="range"
                  id={`metrics_${key}`}
                  value={value}
                  onChange={e => onMetricsChange(key as MetricKey, Number(e.target.value))}
                  min="0"
                  max="100"
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider form-transition"
                  style={{
                    background: `linear-gradient(to right, #115740 0%, #115740 ${value}%, #e5e7eb ${value}%, #e5e7eb 100%)`,
                  }}
                />

                <input
                  type="number"
                  value={value}
                  onChange={e => onMetricsChange(key as MetricKey, Number(e.target.value))}
                  min="0"
                  max="100"
                  className={`w-full px-3 py-2 border-2 rounded-lg text-center font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 ${
                    errors[`metrics_${key}`] ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                />

                {errors[`metrics_${key}`] && (
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
                    {errors[`metrics_${key}`]}
                  </p>
                )}
              </div>
            </div>
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
