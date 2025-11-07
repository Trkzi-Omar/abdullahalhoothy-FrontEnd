import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  Report, 
  fetchCampaigns, 
  isTrySomethingElseReport,
  createNavigationHandlers
} from './campaignCommon';
import { CampaignButton, BackButton } from './CampaignComponents';
import { useUIContext } from '../../context/UIContext';

export default function CampaignPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { closeModal } = useUIContext();

  const handleBack = (currentStep: number, currentSelectedReport: Report | null) => {
    if (currentStep === 2 && isTrySomethingElseReport(currentSelectedReport!)) {
      setStep(0);
    } else {
      setStep(prev => Math.max(prev - 1, 0));
    }
  };

  useEffect(() => {
    fetchCampaigns()
      .then((data: Report[]) => setReports(data))
      .catch(err => console.error('Failed to fetch reports:', err));
  }, []);

  const handleReportClick = (report: Report) => {
    setSelectedReport(report);
    if (isTrySomethingElseReport(report)) {
      closeModal();
    } else {
      setStep(1);
    }
  };

  const handleCustomClick = () => {
    // Go directly to account options since report type is now selected in the form
    setStep(2);
  };

  const handleFinalCustomClick = () => {
    if (selectedReport) {
      // Navigate to custom report (report type will be selected in the form)
      navigate(`${selectedReport.options.custom_redirect.has_account}`);
    }
  };

  const handleFreeClick = (url: string) => {
    navigate(url);
  };

  const handleAccountClick = (url: string) => {
    navigate(url);
  };

  return (
    <div className="flex flex-col w-full h-full justify-center items-center gap-3 p-4">
      {/* Back button */}
      {step > 0 && (
        <div className="self-start">
          <BackButton onClick={() => handleBack(step, selectedReport)} />
        </div>
      )}

      <div className="space-y-4 w-full flex flex-col items-center">
        {/* Step 0: Report selection */}
        {step === 0 &&
          reports.map(report => (
            <CampaignButton
              key={report.id}
              onClick={() => handleReportClick(report)}
              fullWidth={true}
            >
              {report.description}
            </CampaignButton>
          ))}

        {/* Step 1: Free or Custom */}
        {step === 1 && selectedReport && (
          <>
            <CampaignButton
              onClick={() => handleFreeClick(selectedReport.options.free_redirect)}
              fullWidth={true}
            >
              Example report & Interactive Map (Free)
            </CampaignButton>
            <CampaignButton
              onClick={handleCustomClick}
              fullWidth={true}
            >
              I want my Custom Report
            </CampaignButton>
          </>
        )}

        {/* Step 2: Account Options */}
        {step === 2 && selectedReport && (
          <>
            <CampaignButton
              onClick={handleFinalCustomClick}
              fullWidth={true}
            >
              Already have an account
            </CampaignButton>
            <CampaignButton
              onClick={() => handleAccountClick(selectedReport.options.custom_redirect.no_account)}
              fullWidth={true}
            >
              Does not have account
            </CampaignButton>
          </>
        )}
      </div>
    </div>
  );
}
