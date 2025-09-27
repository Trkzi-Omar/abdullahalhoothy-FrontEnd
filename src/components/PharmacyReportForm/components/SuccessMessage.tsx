import { FaCheck } from 'react-icons/fa';

interface SuccessMessageProps {
  show: boolean;
}

const SuccessMessage = ({ show }: SuccessMessageProps) => {
  if (!show) return null;

  return (
    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg shadow-lg animate-fade-in-up">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <FaCheck className="h-6 w-6 text-green-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-base font-semibold text-green-800">Report Generated Successfully!</h3>
          <p className="text-sm text-green-700">
            Your pharmacy location report has been created and is ready for review.
          </p>
          <p className="text-xs text-green-600 mt-1">Redirecting to your report...</p>
        </div>
      </div>
    </div>
  );
};

export default SuccessMessage;
