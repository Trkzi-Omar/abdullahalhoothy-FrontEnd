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
import urls from '../../urls.json'


export default function CampaignPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [step, setStep] = useState(0);
    const [hoveredBg, setHoveredBg] = useState<string | null>(null); // added for hover background

  const navigate = useNavigate();
  const { closeModal } = useUIContext();

  const { handleFreeClick, handleAccountClick, handleBack } = createNavigationHandlers(navigate, setStep);

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

  const handleCustomClick = (report: Report) => {
    // Instead of going to step 2, redirect directly to has_account URL
    navigate(report.options.custom_redirect);
  };

    const API_BASE =  urls.REACT_APP_IMG_API_URL;

  const resolveBgImage = (path?: string | null) => {
    if (!path) return undefined;
    return path.startsWith('http') ? path : `${API_BASE}${path}`;
  };

  return (
    <div className="flex flex-col w-full h-full justify-center items-center gap-3 p-4">

            {/* Background image */}
{hoveredBg && (
<div className="fixed z-0 top-0 left-1/2 w-full h-full bg-center bg-no-repeat bg-contain transition-opacity duration-300 opacity-70 pointer-events-none"
     style={{
       backgroundImage: `url(${resolveBgImage(hoveredBg)})`,
       transform: 'translateX(-50%)',
     }} />

)}
      {/* Back button */}
      {step > 0 && (
        <div className="self-start relative z-10">
          <BackButton onClick={() => handleBack(step, selectedReport)} />
        </div>
      )}

      <div className="relative z-10 space-y-4 w-full flex flex-col items-center">
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
              onClick={() => handleCustomClick(selectedReport)}
              fullWidth={true}
            >
              I want my Custom Report
            </CampaignButton>
          </>
        )}

        {/* Step 2: Account Options (only relevant if Try Something Else was used, but we hide it now) */}
        {step === 2 && selectedReport && (
          <>
            <CampaignButton
              onClick={() => handleAccountClick(selectedReport.options.custom_redirect.has_account)}
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
