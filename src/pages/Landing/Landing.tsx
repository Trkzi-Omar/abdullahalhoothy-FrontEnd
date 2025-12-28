import { useState } from 'react';
import { translations } from './translations';
import LandingNavbar from '../../components/Landing/LandingNavbar';
import LandingHero from '../../components/Landing/LandingHero';
import LandingFeatures from '../../components/Landing/LandingFeatures';
import LandingReportGrid from '../../components/Landing/LandingReportGrid';
import LandingCaseStudy from '../../components/Landing/LandingCaseStudy';
import LandingCTA from '../../components/Landing/LandingCTA';
import LandingFooter from '../../components/Landing/LandingFooter';

const Landing = () => {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const t = translations[lang];

  return (
    <div
      className={`w-full min-h-screen flex flex-col bg-brand-dark text-slate-200 antialiased selection:bg-brand-green selection:text-white overflow-x-hidden scrollbar-landing ${
        lang === 'ar' ? 'font-arabic' : 'font-sans'
      }`}
    >
      <LandingNavbar lang={lang} setLang={setLang} t={t} />
      <main className="flex-grow">
        <LandingHero t={t} />
        <LandingFeatures t={t} />
        <LandingReportGrid t={t} />
        <LandingCaseStudy t={t} />
        <LandingCTA t={t} />
      </main>
      <LandingFooter t={t} />
    </div>
  );
};

export default Landing;
