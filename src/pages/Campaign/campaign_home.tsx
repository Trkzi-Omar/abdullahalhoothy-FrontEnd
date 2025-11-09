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
  const [hoveredBg, setHoveredBg] = useState<string | null>(null); // added for hover background

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

  const handleCustomClick = () => (url: string) => navigate(url);

  const handleFinalCustomClick = () => {
    if (selectedReport) {
      navigate(`${selectedReport.options.custom_redirect}`);
    }
  };

  const handleFreeClick = (url: string) => navigate(url);
  const handleAccountClick = (url: string) => navigate(url);

  // Backend base URL
  const API_BASE = 'http://37.27.195.216:8000';

  // Helper to resolve full backend URL
  const resolveBgImage = (path?: string | null) => {
    if (!path) return undefined;
    return path.startsWith('http') ? path : `${API_BASE}${path}`;
  };

  return (
<div className="relative flex flex-col w-full min-h-screen h-auto justify-center items-center gap-3 p-4" 
>
      {/* Background image */}
      {hoveredBg && (
  <div
    className="absolute inset-0 z-0 w-full h-full bg-center bg-no-repeat bg-contain"
    style={{
      backgroundImage: `url(${resolveBgImage(hoveredBg)})`,
    }}
  />
)}

      {/* Foreground content */}
      <div className="relative z-10 w-full flex flex-col items-center">
        {/* Back button */}
        {step > 0 && (
          <div className="self-start mb-4">
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
                onMouseEnter={() => setHoveredBg(report.bgImage)} // show hover bg
                onMouseLeave={() => setHoveredBg(null)}           // remove hover bg
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
                onClick={handleFinalCustomClick}
                fullWidth={true}
              >
                I want my Custom Report
              </CampaignButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
