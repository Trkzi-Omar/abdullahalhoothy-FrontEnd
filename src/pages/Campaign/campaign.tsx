import { useEffect, useState } from 'react';

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
  const [step, setStep] = useState(0); // 0 = reports list, 1 = free/custom, 2 = account options
  const [hoveredBg, setHoveredBg] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/campaign-details')
      .then(res => res.json())
      .then((data: Report[]) => setReports(data))
      .catch(err => console.error('Failed to fetch reports:', err));
  }, []);

  const handleReportClick = (report: Report) => {
    setSelectedReport(report);

    // If it's the "Try something else" report (id === 4 or by title check)
    if (report.id === 4 || report.title === 'Try Something Else') {
      setStep(2); // Skip directly to account options
    } else {
      setStep(1); // Normal flow
    }
  };
  const handleFreeClick = (url: string) => {
    window.location.href = url;
  };

  const handleCustomClick = () => {
    setStep(2);
  };

  const handleAccountClick = (url: string) => {
    window.location.href = url;
  };

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
            <button
              onClick={handleBack}
              className="bg-[#8E50EA] hover:bg-purple-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md transition-colors"
            >
              ← Back
            </button>
          </div>
        )}

        <div className="space-y-4">
          {/* Step 0: Report selection */}
          {step === 0 &&
            reports.map(report => (
              <div
                key={report.id}
                onClick={() => handleReportClick(report)}
                onMouseEnter={() => setHoveredBg(report.bgImage)}
                onMouseLeave={() => setHoveredBg(null)}
                className="cursor-pointer flex items-center gap-4 p-4 rounded-lg bg-[#8E50EA] hover:bg-purple-400 border border-purple-300 transition-colors"
              >
                <input type="radio" className="accent-purple-700" />
                <div>
                  <p className="text-white font-medium">{report.description}</p>
                </div>
              </div>
            ))}

          {/* Step 1: Free or Custom */}
          {step === 1 && selectedReport && (
            <>
              <div
                onClick={() => handleFreeClick(selectedReport.options.free_redirect)}
                className="cursor-pointer flex items-center gap-4 p-4 rounded-lg bg-[#8E50EA] hover:bg-purple-400 border border-purple-300 transition-colors"
              >
                <p className="text-white font-medium">Free Report</p>
              </div>
              <div
                onClick={handleCustomClick}
                className="cursor-pointer flex items-center gap-4 p-4 rounded-lg bg-[#8E50EA] hover:bg-purple-400 border border-purple-300 transition-colors"
              >
                <p className="text-white font-medium">Custom Report</p>
              </div>
            </>
          )}

          {/* Step 2: Account Options */}
          {step === 2 && selectedReport && (
            <>
              <div
                onClick={() =>
                  handleAccountClick(selectedReport.options.custom_redirect.has_account)
                }
                className="cursor-pointer flex items-center gap-4 p-4 rounded-lg bg-[#8E50EA] hover:bg-purple-400 border border-purple-300 transition-colors"
              >
                <p className="text-white font-medium">Already have an account</p>
              </div>
              <div
                onClick={() =>
                  handleAccountClick(selectedReport.options.custom_redirect.no_account)
                }
                className="cursor-pointer flex items-center gap-4 p-4 rounded-lg bg-[#8E50EA] hover:bg-purple-400 border border-purple-300 transition-colors"
              >
                <p className="text-white font-medium">Does not have account</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
