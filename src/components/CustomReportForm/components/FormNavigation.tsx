import { FaArrowLeft, FaArrowRight, FaCheck } from 'react-icons/fa';
import { TOTAL_STEPS } from '../constants';

interface FormNavigationProps {
  currentStep: number;
  isSubmitting: boolean;
  onPreviousStep: () => void;
  onNextStep: () => void;
  onSubmit: () => void;
  validateCurrentStep: (step: number) => boolean;
  validateForm: () => boolean;
  formData: {
    custom_locations: Array<{ lat: number; lng: number }>;
    current_location: { lat: number; lng: number };
  };
  businessType: string;
  isAdvancedMode: boolean;
}

const FormNavigation = ({
  currentStep,
  isSubmitting,
  onPreviousStep,
  onNextStep,
  onSubmit,
  validateCurrentStep,
  validateForm,
  formData,
  businessType,
  isAdvancedMode,
}: FormNavigationProps) => {
  // Determine if current step should show "Skip" instead of "Next"
  let shouldShowSkip = false;
  let nextButtonText = 'Next';

  if (currentStep === 3) {
    // Custom locations step - check if any location has been set (not 0,0)
    shouldShowSkip = !formData.custom_locations.some(loc => loc.lat !== 0 || loc.lng !== 0);
  } else if (currentStep === 4) {
    // Current location step - check if location has been set (not 0,0)
    shouldShowSkip = formData.current_location.lat === 0 && formData.current_location.lng === 0;
  }

  nextButtonText = shouldShowSkip ? 'Skip' : 'Next';

  // Handle simple mode - show "Generate Report" on step 1
  if (!isAdvancedMode && currentStep === 1) {
    nextButtonText = 'Generate Report';
  }

  return (
    <div className="flex items-center justify-between pt-6 border-t border-gray-200">
      <button
        type="button"
        onClick={onPreviousStep}
        disabled={currentStep === 1}
        className="flex items-center px-4 py-2 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100"
      >
        <FaArrowLeft className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      <div className="flex items-center space-x-3">
        {currentStep < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={onNextStep}
            disabled={!validateCurrentStep(currentStep)}
            className={`flex items-center px-6 py-2 font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed btn-hover-lift ${
              !isAdvancedMode && currentStep === 1
                ? 'bg-gem-gradient text-white hover:opacity-90 focus:ring-primary/20'
                : shouldShowSkip
                  ? 'bg-gray-500 text-white hover:bg-gray-600 focus:ring-gray-500/20'
                  : 'bg-primary text-white hover:bg-primary/90 focus:ring-primary/20'
            }`}
          >
            {!isAdvancedMode && currentStep === 1 ? (
              <>
                <FaCheck className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">{nextButtonText}</span>
                <span className="sm:hidden">{nextButtonText}</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">{nextButtonText}</span>
                <span className="sm:hidden">{nextButtonText}</span>
                <FaArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            disabled={isSubmitting || !validateForm()}
            onClick={onSubmit}
            className="flex items-center px-6 py-2 bg-gem-gradient text-white font-semibold rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed btn-hover-lift"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
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
                <span className="hidden sm:inline">Generating Report...</span>
                <span className="sm:hidden">Generating...</span>
              </>
            ) : (
              <>
                <FaCheck className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Generate Report</span>
                <span className="sm:hidden">Generate</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default FormNavigation;
