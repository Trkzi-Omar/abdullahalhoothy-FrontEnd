import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import apiRequest from '../../services/apiRequest';
import urls from '../../urls.json';
import './CustomReportForm.css';
import { FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';
import { CustomReportData, FormErrors, MetricKey } from '../../types/allTypesAndInterfaces';
import { TOTAL_STEPS, getInitialFormData } from './constants';
import { useBusinessTypeConfig } from './hooks/useBusinessTypeConfig';

// Import step components
import BasicInformationStep from './components/BasicInformationStep';
import { EvaluationMetricsStep } from './components/EvaluationMetricsStep';
import CustomLocationsStep from './components/CustomLocationsStep';
import CurrentLocationStep from './components/CurrentLocationStep';
import ProgressIndicator from './components/ProgressIndicator';
import FormNavigation from './components/FormNavigation';
import SuccessMessage from './components/SuccessMessage';

const CustomReportForm = () => {
  const { authResponse } = useAuth();
  const navigate = useNavigate();
  const { businessType } = useParams<{ businessType: string }>();

  // Validate business type exists
  if (!businessType) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Business Type Required</h1>
          <p className="text-gray-600 mb-4">Please specify a business type in the URL</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Fetch business type configuration from API
  const {
    config: businessConfig,
    loading: configLoading,
    error: configError,
  } = useBusinessTypeConfig(businessType);

  const [formData, setFormData] = useState<CustomReportData | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);

  // Set user_id when component mounts
  useEffect(() => {
    if (authResponse && 'localId' in authResponse && formData && !formData.user_id) {
      setFormData(prev =>
        prev
          ? {
              ...prev,
              user_id: authResponse.localId,
            }
          : null
      );
    }
  }, [authResponse, formData?.user_id]);

  // Initialize form data when business configuration is loaded
  useEffect(() => {
    if (businessConfig) {
      const initialData = getInitialFormData(businessType, businessConfig);
      setFormData(initialData);
    }
  }, [businessConfig, businessType]);

  const validateForm = (): boolean => {
    if (!formData) return false;

    const newErrors: FormErrors = {};

    // Validate city selection
    if (!formData.city_name) {
      newErrors.city_name = 'Please select a city';
    }

    // Validate evaluation metrics sum to 100%
    const metricsSum = Object.values(formData.evaluation_metrics).reduce(
      (sum, value) => sum + value,
      0
    );
    if (metricsSum !== 100) {
      newErrors.evaluation_metrics = `Evaluation metrics must sum to 100%. Current sum: ${metricsSum}%`;
    }

    // Validate individual metrics are not negative
    Object.entries(formData.evaluation_metrics).forEach(([key, value]) => {
      if (value < 0) {
        newErrors[`metrics_${key}`] = `${key} cannot be negative`;
      }
    });

    // Custom locations and current location are optional - no validation needed

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Separate validation function that doesn't update state (for use during render)
  const validateFormWithoutStateUpdate = (): boolean => {
    if (!formData) return false;

    // Validate city selection
    if (!formData.city_name) {
      return false;
    }

    // Validate evaluation metrics sum to 100%
    const metricsSum = Object.values(formData.evaluation_metrics).reduce(
      (sum, value) => sum + value,
      0
    );
    if (metricsSum !== 100) {
      return false;
    }

    // Validate individual metrics are not negative
    const hasNegativeMetrics = Object.values(formData.evaluation_metrics).some(value => value < 0);
    if (hasNegativeMetrics) {
      return false;
    }

    return true;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev =>
      prev
        ? {
            ...prev,
            [field]: value,
          }
        : null
    );

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleMetricsChange = (metric: MetricKey, value: number) => {
    setFormData(prev =>
      prev
        ? {
            ...prev,
            evaluation_metrics: {
              ...prev.evaluation_metrics,
              [metric]: value,
            },
          }
        : null
    );

    // Clear metrics error when user changes values
    if (errors.evaluation_metrics) {
      setErrors(prev => ({
        ...prev,
        evaluation_metrics: '',
      }));
    }
  };

  const addCustomLocation = () => {
    if (!formData) return;
    setFormData(prev => ({
      ...prev!,
      custom_locations: [...prev!.custom_locations, { lat: 0, lng: 0 }],
    }));
  };

  const removeCustomLocation = (index: number) => {
    if (!formData || formData.custom_locations.length <= 1) return;
    setFormData(prev => ({
      ...prev!,
      custom_locations: prev!.custom_locations.filter((_, i) => i !== index),
    }));
  };

  // Memoized callback for custom location selection
  const handleCustomLocationSelect = useCallback(
    (index: number, newLocation: { lat: number; lng: number }) => {
      setFormData(prev =>
        prev
          ? {
              ...prev,
              custom_locations: prev.custom_locations.map((loc, i) =>
                i === index ? newLocation : loc
              ),
            }
          : null
      );

      // Clear location error when user changes values
      setErrors(prev => {
        if (prev[`custom_location_${index}`]) {
          return {
            ...prev,
            [`custom_location_${index}`]: '',
          };
        }
        return prev;
      });
    },
    [] // No dependencies - callback is stable
  );

  // Memoized callback for current location selection
  const handleCurrentLocationSelect = useCallback(
    (newLocation: { lat: number; lng: number }) => {
      setFormData(prev =>
        prev
          ? {
              ...prev,
              current_location: newLocation,
            }
          : null
      );

      // Clear current location error when user changes values
      setErrors(prev => {
        if (prev.current_location) {
          return {
            ...prev,
            current_location: '',
          };
        }
        return prev;
      });
    },
    [] // No dependencies - callback is stable
  );

  const handleSubmit = async () => {
    if (!formData || !validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Prepare form data with default values for optional locations
      const submissionData = {
        ...formData,
        custom_locations: formData.custom_locations.map(loc => ({
          lat: loc.lat || 0,
          lng: loc.lng || 0,
        })),
        current_location: {
          lat: formData.current_location.lat || 0,
          lng: formData.current_location.lng || 0,
        },
      };

      // Use the single endpoint that supports all business types
      // The backend smart_pharmacy_report endpoint handles all business types
      const reportUrl = urls.smart_pharmacy_report;

      const res = await apiRequest({
        url: reportUrl,
        method: 'Post',
        body: submissionData,
      });

      // Check if we have a report URL to redirect to
      // API response format: res.data.data.metadata.html_file_path
      const reportUrlResponse = res?.data?.data?.metadata?.html_file_path;

      // Redirect to the report URL immediately
      if (reportUrlResponse) {
        window.location.href = reportUrlResponse;
      } else {
        // Fallback to home if no URL at all
        navigate('/');
      }
    } catch (error) {
      console.error(`Error submitting ${businessType} report:`, error);

      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as any;

        // Safely extract error message, ensuring we don't display raw JSON
        let errorMessage = 'An error occurred while submitting the report';

        if (apiError.response?.data?.detail) {
          errorMessage = apiError.response.data.detail;
        } else if (apiError.response?.data?.message) {
          errorMessage = apiError.response.data.message;
        } else if (apiError.response?.data?.error) {
          errorMessage = apiError.response.data.error;
        } else if (apiError.message) {
          errorMessage = apiError.message;
        }

        // Ensure we don't display raw JSON or object strings
        if (
          typeof errorMessage === 'object' ||
          errorMessage.includes('{') ||
          errorMessage.includes('[')
        ) {
          errorMessage = 'An error occurred while submitting the report';
        }

        setSubmitError(errorMessage);
      } else {
        // For non-API errors, don't show them to the user
        console.error('Non-API error occurred:', error);
        setSubmitError(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const metricsSum = formData
    ? Object.values(formData.evaluation_metrics).reduce((sum, value) => sum + value, 0)
    : 0;

  const validateCurrentStep = (step: number): boolean => {
    if (!formData) return false;

    switch (step) {
      case 1:
        return !!formData.city_name;
      case 2:
        return metricsSum === 100 && Object.values(formData.evaluation_metrics).every(v => v >= 0);
      case 3:
        return true; // Custom locations are optional
      case 4:
        return true; // Current location is optional
      default:
        return false;
    }
  };

  const goToNextStep = () => {
    if (validateCurrentStep(currentStep)) {
      setCompletedSteps(prev => [...prev.filter(s => s !== currentStep), currentStep]);

      // In simple mode, directly submit the form instead of going to another step
      if (!isAdvancedMode && currentStep === 1) {
        handleSubmit();
        return;
      } else {
        setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
      }
    }
  };

  const goToPreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const goToStep = (step: number) => {
    if (step <= currentStep || completedSteps.includes(step - 1)) {
      setCurrentStep(step);
    }
  };

  const renderCurrentStep = () => {
    if (!formData) return null;

    switch (currentStep) {
      case 1:
        return (
          <BasicInformationStep
            formData={formData}
            errors={errors}
            onInputChange={handleInputChange}
            businessConfig={businessConfig}
            isAdvancedMode={isAdvancedMode}
            onToggleAdvancedMode={setIsAdvancedMode}
            disabled={isSubmitting}
          />
        );
      case 2:
        return (
          <EvaluationMetricsStep
            formData={formData}
            errors={errors}
            onMetricsChange={handleMetricsChange}
            businessType={businessType}
            businessConfig={businessConfig}
            disabled={isSubmitting}
          />
        );
      case 3:
        return (
          <CustomLocationsStep
            formData={formData}
            errors={errors}
            onAddCustomLocation={addCustomLocation}
            onRemoveCustomLocation={removeCustomLocation}
            onCustomLocationSelect={handleCustomLocationSelect}
            businessConfig={businessConfig}
            disabled={isSubmitting}
          />
        );
      case 4:
        return (
          <CurrentLocationStep
            formData={formData}
            errors={errors}
            onLocationSelect={handleCurrentLocationSelect}
            businessType={businessType}
            businessConfig={businessConfig}
            disabled={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  const getBusinessTypeDisplayName = (type: string) => {
    if (businessConfig) {
      return businessConfig.display_name;
    }
    return type; // Fallback to the business type string itself
  };

  // Show loading state while fetching business configuration
  if (configLoading) {
    return (
      <main className="min-h-screen w-full flex justify-center items-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
            {/* Modern animated loading spinner */}
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>
              <div
                className="absolute inset-2 rounded-full border-2 border-transparent border-t-blue-400 animate-spin"
                style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}
              ></div>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-2">Preparing Your Report</h2>
            <p className="text-gray-600 mb-4">
              Setting up the form for your {businessType} location analysis...
            </p>

            {/* Loading dots animation */}
            <div className="flex justify-center space-x-1">
              <div
                className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              ></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Show error state if configuration failed to load
  if (configError) {
    const isNotSupportedError = configError.includes('not yet supported');

    return (
      <main className="min-h-screen w-full flex justify-center items-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div
            className={`border rounded-lg p-6 ${isNotSupportedError ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200'}`}
          >
            <FaExclamationTriangle
              className={`w-8 h-8 mx-auto mb-4 ${isNotSupportedError ? 'text-orange-500' : 'text-red-500'}`}
            />
            <h2
              className={`text-xl font-semibold mb-2 ${isNotSupportedError ? 'text-orange-900' : 'text-red-900'}`}
            >
              {isNotSupportedError ? 'Business Type Not Available' : 'Configuration Error'}
            </h2>
            <p className={`mb-4 ${isNotSupportedError ? 'text-orange-700' : 'text-red-700'}`}>
              {configError}
            </p>
            <button
              onClick={() => navigate(-1)}
              className={`px-4 py-2 text-white rounded-lg transition-colors ${
                isNotSupportedError
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              Go Back
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Don't render form until we have both config and formData
  if (!businessConfig || !formData) {
    return (
      <main className="min-h-screen w-full flex justify-center items-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
            {/* Modern animated loading spinner */}
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>
              <div
                className="absolute inset-2 rounded-full border-2 border-transparent border-t-blue-400 animate-spin"
                style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}
              ></div>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-2">Almost Ready</h2>
            <p className="text-gray-600 mb-4">Finalizing your {businessType} report setup...</p>

            {/* Loading dots animation */}
            <div className="flex justify-center space-x-1">
              <div
                className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              ></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full flex justify-center items-start bg-gradient-to-br from-slate-50 to-blue-50 py-2 px-2 sm:py-4 sm:px-4">
      <div className="max-w-4xl mx-auto w-full">
        {/* Success Message */}
        <SuccessMessage
          show={showSuccessMessage}
          businessType={businessType}
          businessConfig={businessConfig}
        />

        <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gem-gradient px-4 py-3 text-white">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex items-center px-2 py-1.5 text-xs font-medium text-white bg-white/20 backdrop-blur-sm border border-white/30 rounded-md hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200"
              >
                <FaArrowLeft className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Back</span>
              </button>
              <div className="text-center flex-1">
                <h1 className="text-lg font-bold">
                  {getBusinessTypeDisplayName(businessType)} Location Report
                </h1>
              </div>
              <div className="w-16"></div> {/* Spacer for centering */}
            </div>
          </div>

          {/* Progress Indicator - Only show in advanced mode */}
          {isAdvancedMode && (
            <ProgressIndicator
              currentStep={currentStep}
              completedSteps={completedSteps}
              onStepClick={goToStep}
              disabled={isSubmitting}
            />
          )}

          <div className="p-4 sm:p-5">
            <form className="space-y-4">
              {/* Current Step Content */}
              {renderCurrentStep()}

              {/* Processing Status */}
              {isSubmitting && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-blue-600 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          Generating your {businessType} report...
                        </p>
                        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                          ~3 min
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Please keep this page open while we process your location analysis
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Error */}
              {submitError && (
                <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FaExclamationTriangle className="h-6 w-6 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium">{submitError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              {formData && (
                <FormNavigation
                  currentStep={currentStep}
                  isSubmitting={isSubmitting}
                  onPreviousStep={goToPreviousStep}
                  onNextStep={goToNextStep}
                  onSubmit={handleSubmit}
                  validateCurrentStep={validateCurrentStep}
                  validateForm={validateFormWithoutStateUpdate}
                  formData={formData}
                  isAdvancedMode={isAdvancedMode}
                />
              )}
            </form>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CustomReportForm;
