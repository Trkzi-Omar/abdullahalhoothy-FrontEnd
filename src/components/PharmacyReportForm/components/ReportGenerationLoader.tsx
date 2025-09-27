import { useState, useEffect } from 'react';
import { FaSpinner, FaChartLine, FaMapMarkerAlt, FaUsers, FaStore, FaTimes } from 'react-icons/fa';

interface ReportGenerationLoaderProps {
  isGenerating: boolean;
  onCancel?: () => void;
}

interface GenerationStep {
  id: number;
  title: string;
  description: string;
  icon: JSX.Element;
  estimatedTime: number; // in seconds
}

const GENERATION_STEPS: GenerationStep[] = [
  {
    id: 1,
    title: 'Analyzing Location Data',
    description: 'Processing geographic coordinates and mapping data',
    icon: <FaMapMarkerAlt className="w-5 h-5" />,
    estimatedTime: 30,
  },
  {
    id: 2,
    title: 'Evaluating Demographics',
    description: 'Analyzing population density and demographic patterns',
    icon: <FaUsers className="w-5 h-5" />,
    estimatedTime: 60,
  },
  {
    id: 3,
    title: 'Assessing Competition',
    description: 'Identifying existing pharmacies and market saturation',
    icon: <FaStore className="w-5 h-5" />,
    estimatedTime: 45,
  },
  {
    id: 4,
    title: 'Generating Insights',
    description: 'Creating comprehensive analysis and recommendations',
    icon: <FaChartLine className="w-5 h-5" />,
    estimatedTime: 90,
  },
];

export const ReportGenerationLoader = ({ isGenerating, onCancel }: ReportGenerationLoaderProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isGenerating) {
      setCurrentStep(1);
      setProgress(0);
      setTimeRemaining(0);
      setElapsedTime(0);
      return;
    }

    const startTime = Date.now();
    const totalEstimatedTime = GENERATION_STEPS.reduce((sum, step) => sum + step.estimatedTime, 0);
    setTimeRemaining(totalEstimatedTime);

    // Simulate progress through steps
    const progressInterval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedTime(elapsed);

      // Calculate which step we should be on based on elapsed time
      let cumulativeTime = 0;
      let stepIndex = 0;

      for (let i = 0; i < GENERATION_STEPS.length; i++) {
        cumulativeTime += GENERATION_STEPS[i].estimatedTime;
        if (elapsed <= cumulativeTime) {
          stepIndex = i;
          break;
        }
      }

      setCurrentStep(stepIndex + 1);

      // Calculate progress percentage
      const stepProgress = Math.min(
        1,
        (elapsed - (cumulativeTime - GENERATION_STEPS[stepIndex].estimatedTime)) /
          GENERATION_STEPS[stepIndex].estimatedTime
      );
      const totalProgress = (stepIndex + stepProgress) / GENERATION_STEPS.length;
      setProgress(Math.min(100, totalProgress * 100));

      // Calculate remaining time
      const remaining = Math.max(0, totalEstimatedTime - elapsed);
      setTimeRemaining(remaining);
    }, 1000);

    return () => clearInterval(progressInterval);
  }, [isGenerating]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isGenerating) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="relative inline-block mb-4">
            <div className="w-16 h-16 bg-gem-gradient rounded-full flex items-center justify-center">
              <FaSpinner className="w-8 h-8 text-white animate-spin" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Generating Your Report</h2>
          <p className="text-gray-600">
            This may take up to 10 minutes. Please don't close this window.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-bold text-primary">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gem-gradient h-3 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Current Step */}
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
              {GENERATION_STEPS[currentStep - 1]?.icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                Step {currentStep} of {GENERATION_STEPS.length}
              </h3>
              <p className="text-sm text-gray-600">{GENERATION_STEPS[currentStep - 1]?.title}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 ml-13">
            {GENERATION_STEPS[currentStep - 1]?.description}
          </p>
        </div>

        {/* Time Information */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-blue-600">{formatTime(elapsedTime)}</div>
            <div className="text-xs text-blue-500">Elapsed Time</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-orange-600">{formatTime(timeRemaining)}</div>
            <div className="text-xs text-orange-500">Estimated Remaining</div>
          </div>
        </div>

        {/* All Steps Progress */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Generation Steps</h4>
          <div className="space-y-2">
            {GENERATION_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                    index + 1 < currentStep
                      ? 'bg-green-500 text-white'
                      : index + 1 === currentStep
                        ? 'bg-primary text-white animate-pulse'
                        : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {index + 1 < currentStep ? (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span className="text-xs font-bold">{step.id}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{step.title}</div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                </div>
                <div className="text-xs text-gray-400">~{step.estimatedTime}s</div>
              </div>
            ))}
          </div>
        </div>

        {/* Cancel Button */}
        {onCancel && (
          <div className="text-center">
            <button
              onClick={onCancel}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              <FaTimes className="w-4 h-4 mr-2" />
              Cancel Generation
            </button>
          </div>
        )}

        {/* Tips */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            💡 <strong>Tip:</strong> The report generation process analyzes multiple data sources to
            provide you with the most accurate insights. This comprehensive analysis ensures the
            highest quality recommendations for your pharmacy location.
          </p>
        </div>
      </div>
    </div>
  );
};
