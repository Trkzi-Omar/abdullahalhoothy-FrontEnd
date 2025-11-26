import { useEffect, useState } from 'react';
import { 
  Report, 
  fetchCampaigns, 
  isTrySomethingElseReport,
  createNavigationHandlers
} from './campaignCommon';
import { CampaignButton, BackButton } from './CampaignComponents';

export default function CampaignPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [step, setStep] = useState(0); // 0 = reports list, 1 = free/custom, 2 = account options
  const [hoveredBg, setHoveredBg] = useState<string | null>(null);

  const navigate = (url: string) => {
    window.location.href = url;
  };

  const { handleFreeClick, handleAccountClick, handleBack } = createNavigationHandlers(navigate, setStep);

  useEffect(() => {
    fetchCampaigns()
      .then((data: Report[]) => setReports(data))
      .catch(err => console.error('Failed to fetch reports:', err));
  }, []);

  const handleReportClick = (report: Report) => {
    setSelectedReport(report);

    // If it's the "Try something else" report (id === 4 or by title check)
    if (isTrySomethingElseReport(report)) {
      setStep(2); // Skip directly to account options
    } else {
      setStep(1); // Normal flow
    }
  };

  const handleCustomClick = () => {
    setStep(2);
  };

  // ✅ Background logic
  const bgImage =
    step === 0
      ? hoveredBg || undefined // hover only works on step 0
      : selectedReport?.bgImage || undefined; // from step 1 onward, fixed

  return (
    <div
      className={`flex w-full justify-center absolute items-center min-h-screen transition-all duration-300 
      ${bgImage ? 'bg-no-repeat bg-cover bg-top bg-center' : 'bg-white'}`}
      style={{
        backgroundImage: bgImage ? `url(${bgImage})` : 'none',
      }}
    >
      {bgImage && <div className="absolute inset-0 bg-black/50"></div>}
      <div className="bg-transparent border-0 w-[87vw] relative z-10">
        {/* Back button (only visible after step 0) */}
        {step > 0 && (
          <div className="mb-4">
            <BackButton onClick={() => handleBack(step, selectedReport)} />
          </div>
        )}

        <div className="space-y-4">
          {/* Step 0: Report selection */}
          {step === 0 &&
            reports.map(report => (
              <CampaignButton
                key={report.id}
                onClick={() => handleReportClick(report)}
                className="mx-auto max-w-[90ch]"
                fullWidth={false}
                onMouseEnter={() => setHoveredBg(report.bgImage)}
                onMouseLeave={() => setHoveredBg(null)}
              >
                {report.description}
              </CampaignButton>
            ))}

          {/* Step 1: Free or Custom */}
          {step === 1 && selectedReport && (
            <>
              <CampaignButton
                onClick={() => handleFreeClick(selectedReport.options.free_redirect)}
                className="mx-auto max-w-[90ch]"
                fullWidth={false}
              >
                Show me Example report and Interactive Map (Free)
              </CampaignButton>
              <CampaignButton
                onClick={handleCustomClick}
                className="mx-auto max-w-[90ch]"
                fullWidth={false}
              >
                I want my Custom Report
              </CampaignButton>
            </>
          )}

          {/* Step 2: Account Options */}
          {step === 2 && selectedReport && (
            <>
              <CampaignButton
                onClick={() => handleAccountClick(selectedReport.options.custom_redirect)}
                className="mx-auto max-w-[90ch]"
                fullWidth={false}
              >
                Already have an account
              </CampaignButton>
              <CampaignButton
                onClick={() => handleAccountClick(selectedReport.options.custom_redirect)}
                className="mx-auto max-w-[90ch]"
                fullWidth={false}
              >
                Does not have account
              </CampaignButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
