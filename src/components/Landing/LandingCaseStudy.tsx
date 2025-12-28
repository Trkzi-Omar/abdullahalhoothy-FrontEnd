import { MdWarning, MdCheckCircle } from 'react-icons/md';
import type { LandingTranslations } from '../../pages/Landing/translations';

interface LandingCaseStudyProps {
  t: LandingTranslations;
}

const LandingCaseStudy = ({ t }: LandingCaseStudyProps) => {
  return (
    <section id="case-study" className="py-24 bg-brand-surface relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-green/20 to-transparent"></div>
      <div className="container mx-auto px-6">
        <div className="bg-brand-dark border border-white/10 rounded-3xl p-8 lg:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-purple/10 via-transparent to-transparent opacity-50"></div>
          <div className="flex flex-col lg:flex-row gap-12 relative z-10">
            <div className="lg:w-1/2 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></span>
                <span className="text-brand-green font-bold text-xs uppercase tracking-widest">
                  {t.caseStudy.label}
                </span>
              </div>
              <h3 className="text-3xl md:text-4xl font-black text-white mb-6">
                {t.caseStudy.title}
              </h3>
              <div className="space-y-4 text-slate-300 leading-relaxed mb-8">
                <p>{t.caseStudy.text1}</p>
                <p className="border-s-2 border-brand-green pl-4 rtl:border-s-0 rtl:border-e-2 rtl:pl-0 rtl:pr-4 italic text-white/90">
                  {t.caseStudy.text2}
                </p>
              </div>
              <div className="flex gap-10 border-t border-white/10 pt-6">
                <div>
                  <div className="text-3xl font-bold text-brand-green mb-1">40%</div>
                  <div className="text-xs text-slate-500 uppercase font-semibold">
                    {t.caseStudy.stat1}
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-brand-purple mb-1">2.5x</div>
                  <div className="text-xs text-slate-500 uppercase font-semibold">
                    {t.caseStudy.stat2}
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2 bg-slate-900/50 rounded-2xl p-6 lg:p-10 flex items-center justify-center border border-white/5">
              <div className="w-full max-w-sm space-y-4">
                <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-lg flex items-center justify-between opacity-60">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 font-bold">
                      A
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{t.caseStudy.orig}</div>
                      <div className="text-xs text-red-400">{t.caseStudy.risk}</div>
                    </div>
                  </div>
                  <MdWarning size={16} className="text-red-500" />
                </div>
                <div className="flex justify-center text-slate-600">
                  <div className="h-8 w-px bg-white/10"></div>
                </div>
                <div className="bg-brand-green/10 border border-brand-green/40 p-5 rounded-xl flex items-center justify-between scale-105 shadow-xl shadow-brand-green/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-green flex items-center justify-center text-white font-bold shadow-lg">
                      B
                    </div>
                    <div>
                      <div className="text-base font-bold text-white">{t.caseStudy.pick}</div>
                      <div className="text-xs text-brand-green">{t.caseStudy.rec}</div>
                    </div>
                  </div>
                  <MdCheckCircle size={20} className="text-brand-green" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingCaseStudy;
