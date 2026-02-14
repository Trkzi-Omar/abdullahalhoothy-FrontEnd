import { MdDescription, MdPeople, MdMyLocation, MdShowChart } from 'react-icons/md';
import type { LandingTranslations } from '../../pages/Landing/translations';

interface LandingFeaturesProps {
  t: LandingTranslations;
}

// Map feature indices to icons
const featureIcons = [MdShowChart, MdPeople, MdMyLocation];

const LandingFeatures = ({ t }: LandingFeaturesProps) => {
  return (
    <section id="features" className="py-24 relative bg-brand-surface/50 border-y border-white/5">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center mb-16 text-center">
          <span className="text-brand-green font-bold text-sm tracking-wider uppercase mb-3 block">
            {t.features.title}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t.features.sub}</h2>
        </div>

        <div className="mb-20 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-brand-dark relative group">
          <div className="absolute inset-0 bg-gradient-to-b from-brand-green/5 to-transparent pointer-events-none"></div>
          <div className="grid lg:grid-cols-2">
            <div className="p-8 lg:p-12 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 text-brand-purple font-bold mb-4">
                <MdDescription size={20} />
                <span className="uppercase tracking-widest text-xs">{t.features.visualBadge}</span>
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">
                {t.features.visualLabel}
              </h3>
              <p className="text-slate-400 leading-relaxed mb-6">{t.features.visualDesc}</p>
              <div className="flex gap-4">
                <a
                  href="http://localhost:3000/static/reports/cafe_sales_report.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-brand-surface border border-white/10 px-4 py-2 rounded text-xs text-slate-300 hover:bg-brand-surface/80 hover:border-white/20 transition-all cursor-pointer"
                >
                  Cafe Report
                </a>
                <a
                  href="http://localhost:3000/static/reports/pharmacy_sales_report.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-brand-surface border border-white/10 px-4 py-2 rounded text-xs text-slate-300 hover:bg-brand-surface/80 hover:border-white/20 transition-all cursor-pointer"
                >
                  Pharmacy Report
                </a>
              </div>
            </div>
            <div className="bg-brand-surface/50 p-8 flex items-center justify-center relative overflow-hidden">
              <div className="w-full aspect-[4/5] md:aspect-[4/3] relative rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-brand-card flex items-center justify-center group-hover:scale-[1.02] transition-transform duration-500">
                <img
                  src="/images/landing/report.webp"
                  alt="Report Sample"
                  className="w-full h-full object-contain"
                  loading="lazy"
                  decoding="async"
                  width={800}
                  height={1000}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentNode as HTMLElement;
                    if (parent) {
                      parent.innerHTML =
                        '<div class="text-center p-4"><span class="block text-brand-purple mb-2 text-4xl">📄</span><span class="text-white font-bold">Image Missing</span><br/><span class="text-xs text-slate-400">Please add report.png</span></div>';
                    }
                  }}
                />

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                  <a
                    href="http://localhost:3000/static/reports/cafe_sales_report.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 hover:bg-gray-100 cursor-pointer"
                  >
                    {t.features.visualOverlay}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {t.features.list.map((feat, idx) => {
            const Icon = featureIcons[idx];
            return (
              <div
                key={idx}
                className="bg-brand-card/60 backdrop-blur-[12px] border border-white/8 p-8 rounded-2xl hover:border-brand-green/40 transition-all duration-300 group hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-xl bg-brand-card border border-white/10 flex items-center justify-center text-brand-green mb-6 group-hover:bg-brand-green group-hover:text-white transition-colors">
                  <Icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feat.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LandingFeatures;
