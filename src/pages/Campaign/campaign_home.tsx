import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
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
import { useUIContext } from '../../context/UIContext';

export default function CampaignHomePage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { closeModal } = useUIContext();

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
      closeModal();
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
    <div className="flex flex-col w-full h-full p-4 sm:p-6 overflow-y-auto max-h-[85vh]">
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
          {/* Step 0: Report selection */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                  The free preview gives you a sample of what's possible. Create a custom report to
                  get analysis specific to your target location.
                </p>
              </HelpSection>
            </div>
          )}
        </>
      )}
    </div>
  );
}
