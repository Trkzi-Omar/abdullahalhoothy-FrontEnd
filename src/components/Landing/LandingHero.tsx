import { MdSearch, MdCheckCircleOutline, MdInfo } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import type { LandingTranslations } from '../../pages/Landing/translations';
import { LANDING_VIDEO } from './constants';

interface LandingHeroProps {
  t: LandingTranslations;
}

const LandingHero = ({ t }: LandingHeroProps) => {
  const navigate = useNavigate();
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/');
  };

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden min-h-screen flex items-center">
      {/* Ambient glow effects */}
      <div
        className="absolute w-[500px] h-[500px] bg-brand-purple/20 top-[-10%] left-[-10%] blur-[120px] rounded-full opacity-40"
        style={{ filter: 'blur(100px)' }}
      ></div>
      <div
        className="absolute w-[600px] h-[600px] bg-brand-green/10 bottom-[-10%] right-[-10%] blur-[120px] rounded-full opacity-40"
        style={{ filter: 'blur(100px)' }}
      ></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="text-center lg:text-start lg:rtl:text-right animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-medium mb-6">
              <MdInfo size={14} className="text-slate-400" /> {t.hero.alert}
            </div>
            <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">{t.cta.title}</h2>
          <p className="text-slate-400 text-xl mb-10 max-w-2xl mx-auto">{t.cta.sub}</p>
      
        </div>
           
            <form onSubmit={handleSearch} className="relative max-w-lg lg:max-w-xl mx-auto lg:mx-0 mb-6 group">
              <div className="absolute inset-0 bg-brand-green/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative bg-white/5 border border-white/10 rounded-xl p-2 lg:p-2.5 flex items-center backdrop-blur-sm focus-within:bg-brand-card focus-within:border-brand-green/50 transition-all">
                <div className="px-4 text-slate-400">
                  <MdSearch size={20} />
                </div>
                <input
                  type="text"
                  placeholder={t.hero.placeholder}
                  className="bg-transparent border-none outline-none text-white w-full placeholder:text-slate-500 placeholder:opacity-100 h-10 lg:h-12 text-base lg:text-base"
                />
                <button
                  type="submit"
                  className="bg-brand-green hover:bg-brand-greenHover text-white px-6 lg:px-7 py-2 lg:py-2.5 rounded-lg font-bold text-sm lg:text-base transition-colors shadow-lg whitespace-nowrap hidden sm:block"
                >
                  {t.hero.ctaNoSignup}
                </button>
              </div>
              <button
                type="submit"
                className="mt-3 w-full sm:hidden bg-brand-green hover:bg-brand-greenHover text-white px-6 py-3 rounded-lg font-bold"
              >
                {t.hero.ctaNoSignup}
              </button>
            </form>
            <div className="flex items-center justify-center lg:justify-start gap-4 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1">
                <MdCheckCircleOutline size={14} className="text-brand-green" />
                <span>No Credit Card</span>
              </span>
              <span className="flex items-center gap-1">
                <MdCheckCircleOutline size={14} className="text-brand-green" />
                <span>Instant Report</span>
              </span>
            </div>
          </div>
          <div
            className="relative animate-fade-in-up opacity-0"
            style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black aspect-video">
              <iframe
                width={LANDING_VIDEO.width}
                height={LANDING_VIDEO.height}
                src={LANDING_VIDEO.embedUrl}
                title={LANDING_VIDEO.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            <div className="absolute -z-10 top-[-20px] right-[-20px] w-24 h-24 bg-brand-green/20 rounded-full blur-2xl"></div>
            <div className="absolute -z-10 bottom-[-20px] left-[-20px] w-32 h-32 bg-brand-purple/20 rounded-full blur-2xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingHero;
