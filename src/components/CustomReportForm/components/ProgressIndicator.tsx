import { FaCheck } from 'react-icons/fa';
import { getStepDefinitions } from '../constants';

interface ProgressIndicatorProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
  disabled?: boolean;
  reportType?: 'full' | 'location';
  isAdvancedMode?: boolean;
  needsPhoneVerification?: boolean;
  hideLabels?: boolean;
}

const ProgressIndicator = ({
  currentStep,
  completedSteps,
  onStepClick,
  disabled = false,
  reportType,
  isAdvancedMode = true,
  needsPhoneVerification = false,
  hideLabels = false,
}: ProgressIndicatorProps) => {
  // Get filtered step definitions based on report type and advanced mode
  const allSteps = getStepDefinitions(reportType || 'full', isAdvancedMode, needsPhoneVerification);

  // Filter out phone verification step from display (but keep it in the flow)
  const visibleSteps = allSteps.filter(step => step.content !== 'phone-verification');

  // Create a mapping: visual step index -> actual step number
  // This accounts for the hidden phone verification step
  const getActualStepNumber = (visualIndex: number): number => {
    let visualCount = 0;

    for (let i = 0; i < allSteps.length; i++) {
      if (allSteps[i].content !== 'phone-verification') {
        visualCount++;
        if (visualCount === visualIndex + 1) {
          return i + 1; // Convert to 1-indexed
        }
      }
    }

    return visualIndex + 1; // Fallback
  };
  return (
    <div className="px-4 sm:px-6 py-2 border-b border-gray-200">

      <div className="flex items-center justify-between">
        {visibleSteps.map((step, index) => {
          const visualStepNumber = index + 1;
          const actualStepNumber = getActualStepNumber(index);
          const isCompleted = completedSteps.includes(actualStepNumber);
          // Check if current step is phone verification - if so, don't highlight any step as current
          const currentStepContent = allSteps[currentStep - 1]?.content;
          const isCurrent = actualStepNumber === currentStep && currentStepContent !== 'phone-verification';
          const isAccessible = actualStepNumber <= currentStep || completedSteps.includes(actualStepNumber - 1);

          return (
            <div key={step.id} className="flex flex-col items-center flex-1">
              <button
                onClick={() => onStepClick(actualStepNumber)}
                disabled={disabled || !isAccessible}
                className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 transition-all duration-200 ${disabled || !isAccessible
                    ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed opacity-60'
                    : isCompleted
                      ? 'bg-green-500 border-green-500 text-white'
                      : isCurrent
                        ? 'bg-primary border-primary text-white'
                        : 'bg-blue-100 border-blue-300 text-blue-600 hover:bg-blue-200'
                  }`}
              >
                {isCompleted ? (
                  <FaCheck className="w-3 h-3" />
                ) : (
                  <span className="text-xs font-semibold">{visualStepNumber}</span>
                )}
              </button>
              {!hideLabels && (
                <div className="mt-1 text-center">
                  <p
                    className={`text-xs font-medium ${isCurrent
                        ? 'text-primary'
                        : isCompleted
                          ? 'text-green-600'
                          : 'text-gray-600'
                      }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500 hidden lg:block">{step.description}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressIndicator;
