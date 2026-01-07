import { FaCheck } from 'react-icons/fa';
import { getStepDefinitions } from '../constants';

interface ProgressIndicatorProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
  disabled?: boolean;
  reportType?: 'full' | 'location';
  isAdvancedMode?: boolean;
}

const ProgressIndicator = ({
  currentStep,
  completedSteps,
  onStepClick,
  disabled = false,
  reportType,
  isAdvancedMode = true,
}: ProgressIndicatorProps) => {
  // Get filtered step definitions based on report type and advanced mode
  const steps = getStepDefinitions(reportType || 'full', isAdvancedMode);
  const totalSteps = steps.length;

  return (
    <div className="px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-900">Progress</h2>
        <span className="text-xs text-gray-600">
          Step {currentStep} of {totalSteps}
        </span>
      </div>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1; // Order: 1, 2, 3, 4, 5, 6 (or 8 for full)
          return (
            <div key={step.id} className="flex flex-col items-center flex-1">
              <button
                onClick={() => onStepClick(stepNumber)}
                disabled={
                  disabled || (stepNumber > currentStep && !completedSteps.includes(stepNumber - 1))
                }
                className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 transition-all duration-200 ${
                  disabled
                    ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed opacity-60'
                    : completedSteps.includes(stepNumber)
                      ? 'bg-green-500 border-green-500 text-white'
                      : stepNumber === currentStep
                        ? 'bg-primary border-primary text-white'
                        : stepNumber < currentStep || completedSteps.includes(stepNumber - 1)
                          ? 'bg-blue-100 border-blue-300 text-blue-600 hover:bg-blue-200'
                          : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                }`}
              >
                {completedSteps.includes(stepNumber) ? (
                  <FaCheck className="w-3 h-3" />
                ) : (
                  <span className="text-xs font-semibold">{stepNumber}</span>
                )}
              </button>
              <div className="mt-1 text-center">
                <p
                  className={`text-xs font-medium ${
                    stepNumber === currentStep
                      ? 'text-primary'
                      : completedSteps.includes(stepNumber)
                        ? 'text-green-600'
                        : 'text-gray-600'
                  }`}
                >
                  {step.title}
                </p>
                <p className="text-xs text-gray-500 hidden lg:block">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressIndicator;
