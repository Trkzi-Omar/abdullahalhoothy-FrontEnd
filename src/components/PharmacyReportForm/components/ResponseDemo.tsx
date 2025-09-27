import { useState } from 'react';
import { ReportGenerationResponse } from '../types';

// Demo component to test different response scenarios
export const ResponseDemo = () => {
  const [response, setResponse] = useState<ReportGenerationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const simulateSuccess = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    setResponse({
      success: true,
      report_url: 'https://example.com/reports/pharmacy-report-123',
      message: 'Your pharmacy location report has been generated successfully!',
    });
    setIsLoading(false);
  };

  const simulateError = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    setResponse({
      success: false,
      error: 'Insufficient data for the selected location',
      message: 'Please select a different location or add more custom locations.',
    });
    setIsLoading(false);
  };

  const simulateNetworkError = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    setResponse({
      success: false,
      error: 'Network connection failed',
      message: 'Please check your internet connection and try again.',
    });
    setIsLoading(false);
  };

  const clearResponse = () => {
    setResponse(null);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Response Handling Demo</h2>
        <p className="text-gray-600 mb-6">
          Test different response scenarios to see how the form handles success and error states.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={simulateSuccess}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : 'Simulate Success'}
          </button>

          <button
            onClick={simulateError}
            disabled={isLoading}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : 'Simulate Error'}
          </button>

          <button
            onClick={simulateNetworkError}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : 'Network Error'}
          </button>
        </div>

        {response && (
          <div
            className={`p-4 rounded-lg border ${
              response.success
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold mb-2">
                  {response.success ? '✅ Success Response' : '❌ Error Response'}
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Success:</strong> {response.success ? 'true' : 'false'}
                  </div>
                  {response.report_url && (
                    <div>
                      <strong>Report URL:</strong>
                      <a
                        href={response.report_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline ml-1"
                      >
                        {response.report_url}
                      </a>
                    </div>
                  )}
                  {response.error && (
                    <div>
                      <strong>Error:</strong> {response.error}
                    </div>
                  )}
                  {response.message && (
                    <div>
                      <strong>Message:</strong> {response.message}
                    </div>
                  )}
                </div>
              </div>
              <button onClick={clearResponse} className="ml-4 text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Expected Behavior:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              • <strong>Success with URL:</strong> Automatically redirects to report URL
            </li>
            <li>
              • <strong>Success without URL:</strong> Shows success message and redirects to home
            </li>
            <li>
              • <strong>Error:</strong> Shows detailed error message with retry option
            </li>
            <li>
              • <strong>Network Error:</strong> Shows network error with retry option
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
