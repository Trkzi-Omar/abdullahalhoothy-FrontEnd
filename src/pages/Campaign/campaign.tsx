import { useEffect, useState } from 'react';
import { FaMapMarkedAlt, FaGift, FaFileAlt } from 'react-icons/fa';
import {
  Report,
  fetchCampaigns,
  isTrySomethingElseReport,
  createNavigationHandlers,
} from './campaignCommon';
import {
  SelectableCard,
  BackButton,
  LoadingState,
  ErrorState,
  PageHeader,
  HelpSection,
} from './CampaignComponents';

export default function CampaignPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = (url: string) => {
    window.location.href = url;
  };

  const { handleFreeClick, handleCustomClick, handleBack } = createNavigationHandlers(
    navigate,
    setStep
  );

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchCampaigns()
      .then((data: Report[]) => {
        setReports(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch reports:', err);
        setError('Failed to load reports. Please try again.');
        setIsLoading(false);
      });
  }, []);

  const handleReportClick = (report: Report) => {
    setSelectedReport(report);

    if (isTrySomethingElseReport(report)) {
      // Skip to custom report page directly
      navigate(report.options.custom_redirect);
    } else {
      setStep(1);
    }
  };

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    fetchCampaigns()
      .then((data: Report[]) => {
        setReports(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch reports:', err);
        setError('Failed to load reports. Please try again.');
        setIsLoading(false);
      });
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Main Container */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          {/* Page Header */}
          {step === 0 && (
            <PageHeader
              title="Choose Your Report Type"
              description="Select the analysis that best fits your business needs"
            />
          )}
          {step === 1 && (
            <PageHeader
              title="Select Your Option"
              description="Choose between a free preview or a custom detailed report"
            />
          )}

          {/* Back Button */}
          {step > 0 && (
            <div className="mb-6">
              <BackButton onClick={handleBack} />
            </div>
          )}

          {/* Loading State */}
          {isLoading && <LoadingState message="Loading available reports..." />}

          {/* Error State */}
          {error && <ErrorState message={error} onRetry={handleRetry} />}

          {/* Content */}
          {!isLoading && !error && (
            <>
              {/* Step 0: Report Selection */}
              {step === 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reports.map((report, index) => (
                      <SelectableCard
                        key={report.id}
                        title={report.title}
                        description={report.description}
                        onClick={() => handleReportClick(report)}
                        icon={<FaMapMarkedAlt className="w-6 h-6" />}
                        badge={index === 0 ? 'Popular' : undefined}
                      />
                    ))}
                  </div>

                  <HelpSection>
                    <p className="font-medium mb-1">Need help deciding?</p>
                    <p className="text-xs text-gray-600">
                      Each report provides unique insights to help you make data-driven location
                      decisions for your business expansion.
                    </p>
                  </HelpSection>
                </div>
              )}

              {/* Step 1: Free or Custom */}
              {step === 1 && selectedReport && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectableCard
                      title="Free Preview"
                      description="Explore an example report with our interactive map. No account required."
                      onClick={() => handleFreeClick(selectedReport.options.free_redirect)}
                      icon={<FaGift className="w-6 h-6" />}
                    />
                    <SelectableCard
                      title="Custom Report"
                      description="Get a personalized analysis tailored to your specific location and business needs."
                      onClick={() => handleCustomClick(selectedReport.options.custom_redirect)}
                      icon={<FaFileAlt className="w-6 h-6" />}
                      recommended
                    />
                  </div>

                  <HelpSection>
                    <p className="text-xs text-gray-600">
                      The free preview gives you a sample of what's possible. Create a custom report
                      to get analysis specific to your target location.
                    </p>
                  </HelpSection>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
