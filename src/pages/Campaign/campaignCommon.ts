import urls from '../../urls.json';

// Shared types
export type Report = {
  id: number;
  title: string;
  description: string;
  bgImage: string;
  options: {
    free_redirect: string;
    custom_redirect: string;
  };
};

// Shared constants
export const FONT_FAMILY = 'Montserrat Custom, Montserrat, sans-serif';

export const BUTTON_BASE_CLASSES = 'cursor-pointer flex items-center justify-center px-4 py-6 rounded-md bg-[#8E50EA] hover:bg-purple-400 transition-colors';

export const BACK_BUTTON_CLASSES = 'bg-[#8E50EA] hover:bg-purple-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md transition-colors';

export const TEXT_CLASSES = 'text-white font-semibold text-xl text-center break-words';

// Shared API functions
export const fetchCampaigns = async (): Promise<Report[]> => {
  try {
    const response = await fetch(`${urls.REACT_APP_API_URL + urls.fetch_campaigns}`);
    const data: Report[] = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    throw error;
  }
};

// Shared utility functions
export const isTrySomethingElseReport = (report: Report): boolean => {
  return report.id === 4 || report.title === 'Try Something Else';
};

// Common navigation handlers (these can be customized per component if needed)
export const createNavigationHandlers = (
  navigate: (url: string) => void,
  setStep?: (step: number | ((prev: number) => number)) => void
) => {
  const handleFreeClick = (url: string) => {
    navigate(url);
  };

  const handleAccountClick = (url: string) => {
    navigate(url);
  };

  const handleBack = (currentStep: number, currentSelectedReport: Report | null) => {
    if (!setStep) return;
    
    if (currentStep === 2 && isTrySomethingElseReport(currentSelectedReport!)) {
      setStep(0);
    } else {
      setStep(prev => Math.max(prev - 1, 0));
    }
  };

  return {
    handleFreeClick,
    handleAccountClick,
    handleBack,
  };
};

// Common button component props interface
export interface CampaignButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}