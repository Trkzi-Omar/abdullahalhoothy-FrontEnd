import LandingLogo from './LandingLogo';
import type { LandingTranslations } from '../../pages/Landing/translations';

interface LandingFooterProps {
  t: LandingTranslations;
}

const LandingFooter = ({ t }: LandingFooterProps) => {
  return (
    <footer className="bg-black py-8 border-t border-white/5">
      <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="opacity-70 scale-75 origin-left">
          <LandingLogo />
        </div>
        <p className="text-slate-600 text-sm">{t.footer}</p>
      </div>
    </footer>
  );
};

export default LandingFooter;
