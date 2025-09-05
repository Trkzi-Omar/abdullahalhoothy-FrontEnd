import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import urls from '../../urls.json';

type Report = {
  id: number;
  title: string;
  description: string;
  bgImage: string;
  options: {
    free_redirect: string;
    custom_redirect: {
      has_account: string;
      no_account: string;
    };
  };
};

export default function CampaignPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${urls.REACT_APP_API_URL + urls.fetch_campaigns}`)
      .then(res => res.json())
      .then((data: Report[]) => setReports(data))
      .catch(err => console.error('Failed to fetch reports:', err));
  }, []);

  const handleReportClick = (report: Report) => {
    setSelectedReport(report);
    if (report.id === 4 || report.title === 'Try Something Else') {
      // step 2 case won't be used anymore since we are hiding this item
      return;
    } else {
      setStep(1);
    }
  };

  const handleFreeClick = (url: string) => navigate(url);

  const handleCustomClick = (report: Report) => {
    // Instead of going to step 2, redirect directly to has_account URL
    navigate(report.options.custom_redirect.has_account);
  };

  const handleAccountClick = (url: string) => navigate(url);

  const handleBack = () => {
    if (
      step === 2 &&
      (selectedReport?.id === 4 || selectedReport?.title === 'Try Something Else')
    ) {
      setStep(0);
    } else {
      setStep(prev => Math.max(prev - 1, 0));
    }
  };

  return (
    <div className="flex flex-col w-full h-full justify-center items-center gap-3 p-4">
      {/* Back button */}
      {step > 0 && (
        <div className="self-start">
          <button
            onClick={handleBack}
            className="bg-[#8E50EA] hover:bg-purple-600 text-white font-medium px-3 py-1.5 rounded-md text-sm"
          >
            ← Back
          </button>
        </div>
      )}

      <div className="space-y-4 w-full flex flex-col items-center">
        {/* Step 0: Report selection */}
        {step === 0 &&
          reports
            .filter(r => !(r.id === 4 || r.title === 'Try Something Else')) // hide 4th item
            .map(report => (
              <div
                key={report.id}
                onClick={() => handleReportClick(report)}
                className="cursor-pointer flex items-center justify-center px-4 py-6 rounded-md bg-[#8E50EA] hover:bg-purple-400 transition-colors w-full"
              >
                <p
                  className="text-white font-medium text-sm text-center break-words"
                  style={{ fontFamily: 'Montserrat Custom, Montserrat, sans-serif' }}
                >
                  {report.description}
                </p>
              </div>
            ))}

        {/* Step 1: Free or Custom */}
        {step === 1 && selectedReport && (
          <>
            <div
              onClick={() => handleFreeClick(selectedReport.options.free_redirect)}
              className="cursor-pointer flex items-center justify-center px-4 py-6 rounded-md bg-[#8E50EA] hover:bg-purple-400 transition-colors w-full"
            >
              <p
                className="text-white font-medium text-sm text-center break-words"
                style={{ fontFamily: 'Montserrat Custom, Montserrat, sans-serif' }}
              >
                Example report & Interactive Map (Free)
              </p>
            </div>
            <div
              onClick={() => handleCustomClick(selectedReport)}
              className="cursor-pointer flex items-center justify-center px-4 py-6 rounded-md bg-[#8E50EA] hover:bg-purple-400 transition-colors w-full"
            >
              <p
                className="text-white font-medium text-sm text-center break-words"
                style={{ fontFamily: 'Montserrat Custom, Montserrat, sans-serif' }}
              >
                I want my Custom Report
              </p>
            </div>
          </>
        )}

        {/* Step 2: Account Options (only relevant if Try Something Else was used, but we hide it now) */}
        {step === 2 && selectedReport && (
          <>
            <div
              onClick={() => handleAccountClick(selectedReport.options.custom_redirect.has_account)}
              className="cursor-pointer flex items-center justify-center px-4 py-6 rounded-md bg-[#8E50EA] hover:bg-purple-400 transition-colors w-full"
            >
              <p
                className="text-white font-medium text-sm text-center break-words"
                style={{ fontFamily: 'Montserrat Custom, Montserrat, sans-serif' }}
              >
                Already have an account
              </p>
            </div>
            <div
              onClick={() => handleAccountClick(selectedReport.options.custom_redirect.no_account)}
              className="cursor-pointer flex items-center justify-center px-4 py-6 rounded-md bg-[#8E50EA] hover:bg-purple-400 transition-colors w-full"
            >
              <p
                className="text-white font-medium text-sm text-center break-words"
                style={{ fontFamily: 'Montserrat Custom, Montserrat, sans-serif' }}
              >
                Does not have account
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
