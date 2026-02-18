import { useState, useEffect } from 'react';
import { MdClose, MdMenu } from 'react-icons/md';
import { LuLanguages } from 'react-icons/lu';
import LandingLogo from './LandingLogo';
import type { LandingTranslations } from '../../pages/Landing/translations';

interface LandingNavbarProps {
  lang: 'en' | 'ar';
  setLang: (lang: 'en' | 'ar') => void;
  t: LandingTranslations;
}

const LandingNavbar = ({ lang, setLang, t }: LandingNavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'ar' : 'en';
    setLang(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  const navClasses = `fixed top-0 inset-x-0 z-50 transition-all duration-300 bg-[rgba(5,5,5,0.85)] backdrop-blur-[16px] border-b border-white/5 ${
    isScrolled ? 'py-3' : 'py-5'
  }`;

  return (
    <nav className={navClasses}>
      <div className="container mx-auto px-6 flex items-center">
        <LandingLogo />
        <div className="hidden lg:flex items-center gap-8 mx-8">
          <a
            href="#features"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap"
          >
            {t.nav.features}
          </a>
          <a
            href="#case-study"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap"
          >
            {t.nav.caseStudy}
          </a>
        </div>
        <div className="ml-auto hidden lg:flex items-center gap-6">
          <div className="h-5 w-px bg-white/10"></div>
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors text-sm font-semibold"
          >
            <LuLanguages size={16} />
            <span>{lang === 'en' ? 'AR' : 'EN'}</span>
          </button>
          <a
            href="/"
            className="bg-brand-green hover:bg-brand-greenHover text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-brand-green/20 hover:shadow-brand-green/40 flex items-center gap-2 whitespace-nowrap"
          >
            {t.nav.tryFree}
          </a>
        </div>
        <div className="lg:hidden ml-auto flex items-center gap-4">
          <button onClick={toggleLang} className="text-slate-300 font-bold text-xs">
            {lang === 'en' ? 'AR' : 'EN'}
          </button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white p-1" aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}>
            {mobileMenuOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
          </button>
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-brand-card border-b border-white/10 p-6 flex flex-col gap-4 shadow-2xl">
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-300 font-medium py-2"
          >
            {t.nav.features}
          </a>
          <a
            href="#case-study"
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-300 font-medium py-2"
          >
            {t.nav.caseStudy}
          </a>
          <a href="/" className="bg-brand-green text-white text-center py-3 rounded-lg font-bold">
            {t.nav.tryFree}
          </a>
        </div>
      )}
    </nav>
  );
};

export default LandingNavbar;
