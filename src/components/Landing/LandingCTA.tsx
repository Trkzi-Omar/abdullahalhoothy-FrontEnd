import { MdArrowForward } from 'react-icons/md';
import type { LandingTranslations } from '../../pages/Landing/translations';

interface LandingCTAProps {
  t: LandingTranslations;
}

const LandingCTA = ({ t }: LandingCTAProps) => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-brand-green/10 to-brand-dark"></div>
      <div className="container mx-auto px-6 relative z-10 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">{t.cta.title}</h2>
          <p className="text-slate-400 text-xl mb-10 max-w-2xl mx-auto">{t.cta.sub}</p>
          <a
            href="/"
            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-brand-dark rounded-full font-bold text-lg hover:scale-105 transition-transform duration-200 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
          >
            {t.cta.btn}
            <MdArrowForward size={20} />
          </a>
        </div>
      </div>
    </section>
  );
};

export default LandingCTA;
