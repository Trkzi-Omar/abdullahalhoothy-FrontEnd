import { MAIN_LOGOS, MORE_LOGOS } from '../../data/constants/data_sources';
import type { LandingTranslations } from '../../pages/Landing/translations';

interface LandingDataSourcesProps {
  t: LandingTranslations;
}

const LandingDataSources = ({ t }: LandingDataSourcesProps) => {
  return (
    <section className="py-20 bg-brand-dark relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">{t.dataSources.title}</h2>
          <p className="text-slate-400 text-lg">{t.dataSources.sub}</p>
        </div>

        {/* Main Logos - Tier 1 */}
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 mb-12">
          {MAIN_LOGOS.map(logo => (
            <div key={logo.name} className="flex items-center justify-center p-4">
              <img
                src={logo.src}
                alt={logo.name}
                className="h-20 w-auto object-contain transition-all duration-300"
              />
            </div>
          ))}
        </div>

        {/* Separator Text */}
        <div className="text-center mb-10">
          <span className="text-slate-500 font-semibold text-lg">{t.dataSources.andMore}</span>
        </div>

        {/* More Logos - Tier 2 */}
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {MORE_LOGOS.map(logo => (
            <div key={logo.name} className="flex items-center justify-center p-4">
              <img
                src={logo.src}
                alt={logo.name}
                className={`${logo.width} h-auto object-contain transition-all duration-300`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingDataSources;
