import { useState, useEffect, useCallback } from 'react';
import i18next from '../../i18n';
import { getLandingTranslations } from './translations';
import LandingNavbar from '../../components/Landing/LandingNavbar';
import LandingHero from '../../components/Landing/LandingHero';
import LandingFeatures from '../../components/Landing/LandingFeatures';
import LandingReportGrid from '../../components/Landing/LandingReportGrid';
import LandingCaseStudy from '../../components/Landing/LandingCaseStudy';
import LandingDataSources from '../../components/Landing/LandingDataSources';
import LandingCTA from '../../components/Landing/LandingCTA';
import LandingFooter from '../../components/Landing/LandingFooter';

const LANG_STORAGE_KEY = 'landing-lang';

function getSavedLang(): 'en' | 'ar' {
  const saved = localStorage.getItem(LANG_STORAGE_KEY);
  return saved === 'ar' ? 'ar' : 'en';
}

const Landing = () => {
  const [lang, setLangState] = useState<'en' | 'ar'>(() => {
    const savedLang = getSavedLang();
    void i18next.changeLanguage(savedLang);
    return savedLang;
  });

  const setLang = useCallback((newLang: 'en' | 'ar') => {
    void i18next.changeLanguage(newLang);
    setLangState(newLang);
    localStorage.setItem(LANG_STORAGE_KEY, newLang);
  }, []);
  
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const copy = getLandingTranslations(lang);

  return (
    <div
      className={`w-full min-h-screen flex flex-col bg-brand-dark text-slate-200 antialiased selection:bg-brand-green selection:text-white overflow-x-hidden scrollbar-landing ${
        lang === 'ar' ? 'font-arabic' : 'font-sans'
      }`}
    >
      <LandingNavbar lang={lang} setLang={setLang} t={copy} />
      <main className="flex-grow">
        <LandingHero t={copy} />
        <LandingFeatures t={copy} />
        <LandingReportGrid t={copy} />
        <LandingCaseStudy t={copy} />
        <LandingDataSources t={copy} />
        <LandingCTA t={copy} />
      </main>
      <LandingFooter t={copy} />
    </div>
  );
};

export default Landing;
