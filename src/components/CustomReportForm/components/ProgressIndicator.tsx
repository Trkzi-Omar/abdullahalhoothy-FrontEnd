import { FaCheck } from 'react-icons/fa';
import { TOTAL_STEPS } from '../constants';

const STEPS = [
  { id: 1, title: 'Basic Information', description: 'City and location details' },
  { id: 2, title: 'Segment Selection', description: 'Select segment type' },
  { id: 3, title: 'Evaluation Metrics', description: 'Set importance weights' },
  { id: 4, title: 'Set Attributes', description: 'Set required attributes' },
  { id: 5, title: 'Custom Locations', description: 'Add specific locations' },
  { id: 6, title: 'Current Location', description: 'Set your current position' },
  { id: 7, title: 'Report Tier', description: 'Choose report tier' },
];

interface ProgressIndicatorProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
  disabled?: boolean;
}

const ProgressIndicator = ({
  currentStep,
  completedSteps,
  onStepClick,
  disabled = false,
}: ProgressIndicatorProps) => {
  return (
    <div className="px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-900">Progress</h2>
        <span className="text-xs text-gray-600">
          Step {currentStep} of {TOTAL_STEPS}
        </span>
      </div>
      <div className="flex items-center justify-between">
        {STEPS.map(step => (
          <div key={step.id} className="flex flex-col items-center flex-1">
            <button
              onClick={() => onStepClick(step.id)}
              disabled={
                disabled || (step.id > currentStep && !completedSteps.includes(step.id - 1))
              }
              className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 transition-all duration-200 ${
                disabled
                  ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed opacity-60'
                  : completedSteps.includes(step.id)
                    ? 'bg-green-500 border-green-500 text-white'
                    : step.id === currentStep
                      ? 'bg-primary border-primary text-white'
                      : step.id < currentStep || completedSteps.includes(step.id - 1)
                        ? 'bg-blue-100 border-blue-300 text-blue-600 hover:bg-blue-200'
                        : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
              }`}
            >
              {completedSteps.includes(step.id) ? (
                <FaCheck className="w-3 h-3" />
              ) : (
                <span className="text-xs font-semibold">{step.id}</span>
              )}
            </button>
            <div className="mt-1 text-center">
              <p
                className={`text-xs font-medium ${
                  step.id === currentStep
                    ? 'text-primary'
                    : completedSteps.includes(step.id)
                      ? 'text-green-600'
                      : 'text-gray-600'
                }`}
              >
                {step.title}
              </p>
              <p className="text-xs text-gray-500 hidden lg:block">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressIndicator;
