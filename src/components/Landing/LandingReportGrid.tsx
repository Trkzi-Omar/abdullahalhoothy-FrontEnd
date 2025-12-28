import { MdDescription, MdTrendingUp, MdPeople, MdShield } from 'react-icons/md';
import type { LandingTranslations } from '../../pages/Landing/translations';

interface LandingReportGridProps {
  t: LandingTranslations;
}

// Map card indices to icons
const cardIcons = [MdDescription, MdTrendingUp, MdPeople, MdShield];

const LandingReportGrid = ({ t }: LandingReportGridProps) => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <div className="mb-12">
          <h2 className="text-3xl font-black text-white mb-2">{t.report.title}</h2>
          <p className="text-slate-400">{t.report.sub}</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {t.report.cards.map((card, i) => {
            const Icon = cardIcons[i];
            return (
              <div
                key={i}
                className="bg-brand-card p-6 rounded-xl border border-white/5 hover:border-brand-purple/50 transition-colors group"
              >
                <div className="mb-4 text-brand-purple group-hover:scale-110 transition-transform origin-left rtl:origin-right">
                  <Icon size={32} strokeWidth={1.5} />
                </div>
                <h3 className="text-white font-bold mb-2 text-lg">{card.title}</h3>
                <p className="text-slate-500 text-sm">{card.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LandingReportGrid;
