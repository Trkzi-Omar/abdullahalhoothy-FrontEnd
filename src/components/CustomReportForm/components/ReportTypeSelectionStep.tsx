import { FaMapMarkerAlt, FaCity, FaCheck, FaStar } from 'react-icons/fa';

interface ReportTypeSelectionStepProps {
  onSelectReportType: (type: 'full' | 'location') => void;
  disabled?: boolean;
  selectedReportType?: 'full' | 'location' | null;
}

const ReportTypeSelectionStep = ({
  onSelectReportType,
  disabled = false,
  selectedReportType = null,
}: ReportTypeSelectionStepProps) => {
  // Configuration for each report type
  const reportTypeConfig = {
    location: {
      title: 'Evaluate Your Location',
      subtitle: 'Get instant, data-driven analysis for your specific location',
    },
    full: {
      title: 'Full Expansion Report',
      subtitle: 'Comprehensive city-wide analysis to discover optimal locations',
    },
    default: {
      title: 'Choose Your Report Type',
      subtitle: 'Select the analysis that best fits your business needs',
    },
  };

  const config = selectedReportType
    ? reportTypeConfig[selectedReportType]
    : reportTypeConfig.default;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
          {config.title}
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {config.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
        {/* Evaluate Your Location Card - POPULAR */}
        <button
          onClick={() => onSelectReportType('location')}
          disabled={disabled}
          className="group relative bg-white border-2 border-green-400 rounded-2xl p-8 hover:border-green-500 hover:shadow-2xl shadow-lg transition-all duration-300 text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-green-400 disabled:hover:shadow-lg transform hover:-translate-y-1"
        >
          {/* Popular Badge */}
          <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center">
            <FaStar className="w-3 h-3 mr-1" />
            POPULAR
          </div>

          {/* Icon with Gradient Background */}
          <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-md">
            <FaMapMarkerAlt className="w-10 h-10 text-white" />
          </div>

          {/* Title */}
          <h3 className="text-2xl font-extrabold text-gray-900 mb-3 leading-tight">
            Evaluate Your Location
          </h3>

          {/* Description */}
          <p className="text-gray-600 mb-6 leading-relaxed text-base">
            Already have a location in mind? Get instant, data-driven analysis comparing your spot to our comprehensive database.
          </p>

          {/* Pricing - Enhanced */}
          <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 rounded-xl p-4 mb-6 border-2 border-green-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-200 rounded-full -mr-10 -mt-10 opacity-20"></div>
            <div className="relative">
              <div className="flex items-baseline justify-center mb-1">
                <span className="text-4xl font-black text-green-600">FREE</span>
                <span className="text-sm font-semibold text-green-700 ml-2 bg-green-100 px-2 py-0.5 rounded-full">
                  First report
                </span>
              </div>
              <p className="text-xs text-gray-600 text-center font-medium">Then only $150 per report</p>
            </div>
          </div>

          {/* Benefits - Enhanced */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                <FaCheck className="w-3 h-3 text-green-600" />
              </div>
              <span className="ml-3 text-sm text-gray-700 font-medium">Quick and easy process</span>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                <FaCheck className="w-3 h-3 text-green-600" />
              </div>
              <span className="ml-3 text-sm text-gray-700 font-medium">
                Compare to existing database
              </span>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                <FaCheck className="w-3 h-3 text-green-600" />
              </div>
              <span className="ml-3 text-sm text-gray-700 font-medium">Instant actionable insights</span>
            </div>
          </div>

          {/* CTA Button - Enhanced */}
          <div className="mt-6">
            <div className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-center px-6 py-4 rounded-xl group-hover:from-green-700 group-hover:to-emerald-700 transition-all duration-300 shadow-md group-hover:shadow-xl">
              <span className="flex items-center justify-center">
                Evaluate My Location
                <svg
                  className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </span>
            </div>
          </div>
        </button>

        {/* Generate Full Report Card */}
        <button
          onClick={() => onSelectReportType('full')}
          disabled={disabled}
          className="group relative bg-white border-2 border-blue-300 rounded-2xl p-8 hover:border-blue-500 hover:shadow-2xl shadow-lg transition-all duration-300 text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-blue-300 disabled:hover:shadow-lg transform hover:-translate-y-1"
        >
          {/* Icon with Gradient Background */}
          <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-md">
            <FaCity className="w-10 h-10 text-white" />
          </div>

          {/* Title */}
          <h3 className="text-2xl font-extrabold text-gray-900 mb-3 leading-tight">
            Full Expansion Report
          </h3>

          {/* Description */}
          <p className="text-gray-600 mb-6 leading-relaxed text-base">
            Comprehensive city-wide analysis powered by advanced AI to discover your optimal expansion locations.
          </p>

          {/* Pricing - Enhanced */}
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 rounded-xl p-4 mb-6 border-2 border-blue-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 rounded-full -mr-10 -mt-10 opacity-20"></div>
            <div className="relative">
              <div className="flex items-baseline justify-center mb-1">
                <span className="text-sm font-semibold text-blue-600 mr-1">From</span>
                <span className="text-4xl font-black text-blue-600">$1,559</span>
              </div>
              <p className="text-xs text-gray-600 text-center font-medium">Flexible pricing tiers available</p>
            </div>
          </div>

          {/* Benefits - Enhanced */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                <FaCheck className="w-3 h-3 text-blue-600" />
              </div>
              <span className="ml-3 text-sm text-gray-700 font-medium">
                Comprehensive analysis
              </span>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                <FaCheck className="w-3 h-3 text-blue-600" />
              </div>
              <span className="ml-3 text-sm text-gray-700 font-medium">City-wide coverage & insights</span>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                <FaCheck className="w-3 h-3 text-blue-600" />
              </div>
              <span className="ml-3 text-sm text-gray-700 font-medium">
                Custom location comparisons
              </span>
            </div>
          </div>

          {/* CTA Button - Enhanced */}
          <div className="mt-6">
            <div className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-center px-6 py-4 rounded-xl group-hover:from-blue-700 group-hover:to-indigo-700 transition-all duration-300 shadow-md group-hover:shadow-xl">
              <span className="flex items-center justify-center">
                Find Best Locations
                <svg
                  className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* Help Text - Enhanced */}
      <div className="text-center mt-8 pt-6 border-t border-gray-200">
        <div className="max-w-3xl mx-auto bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6">
          <p className="text-sm text-gray-700 mb-2 font-medium">
            💡 <span className="font-semibold">Need help deciding?</span>
          </p>
          <p className="text-xs text-gray-600 leading-relaxed">
            <span className="font-semibold text-green-600">Location reports</span> are perfect for
            analyzing a specific spot you're considering.{' '}
            <span className="font-semibold text-blue-600">Full reports</span> help you discover the
            best locations across an entire city.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportTypeSelectionStep;
