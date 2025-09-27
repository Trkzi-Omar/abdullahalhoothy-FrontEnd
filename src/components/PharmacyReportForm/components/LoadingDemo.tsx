import { useState } from 'react';
import { ReportGenerationLoader } from './ReportGenerationLoader';

// Demo component to showcase the loading state
export const LoadingDemo = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const startDemo = () => {
    setIsGenerating(true);
    // Simulate a 10-minute generation process
    setTimeout(() => {
      setIsGenerating(false);
    }, 600000); // 10 minutes
  };

  const cancelDemo = () => {
    setIsGenerating(false);
  };

  return (
    <div className="p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Loading Demo</h2>
        <p className="text-gray-600 mb-6">
          Click the button below to see the report generation loading state in action.
        </p>

        <button
          onClick={startDemo}
          disabled={isGenerating}
          className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating...' : 'Start Demo Generation'}
        </button>

        {isGenerating && (
          <p className="text-sm text-gray-500 mt-4 text-center">
            Demo will run for 10 minutes. You can cancel anytime.
          </p>
        )}
      </div>

      <ReportGenerationLoader isGenerating={isGenerating} onCancel={cancelDemo} />
    </div>
  );
};
