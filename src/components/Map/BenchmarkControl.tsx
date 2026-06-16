import { useRef } from 'react';
import { useCatalogContext } from '../../context/CatalogContext';
import { useUIContext } from '../../context/UIContext';
import { useClickOutside } from '../../hooks/useClickOutside';
import { t } from '../../i18n';


const BenchmarkControl = () => {
  const { benchmarks, setBenchmarks, polygons, isBenchmarkControlOpen, setIsBenchmarkControlOpen } =
    useCatalogContext();
  const { isMobile } = useUIContext();
  const containerRef = useRef<HTMLDivElement>(null);

  const close = () => setIsBenchmarkControlOpen(false);

  // Close dropdown when clicking outside
  useClickOutside(containerRef, () => {
    if (isBenchmarkControlOpen) {
      close();
    }
  });

  if (polygons.length === 0 || benchmarks.length === 0) return null;

  const handleBenchmarkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setBenchmarks(prev => {
      const updated = prev.map(benchmark => {
        if (benchmark && benchmark?.title && benchmark.title === name) {
          return { ...benchmark, value: parseFloat(value) };
        }
        return benchmark;
      });
      return updated;
    });
  };
  return (
    <div ref={containerRef} className="relative z-[100]">
      <button
        className={`!bg-white !w-auto !rounded-md h-[40px] sm:h-[47px] ${isMobile ? '!p-1.5 text-xs' : '!p-2'} hover:bg-gray-100 transition-colors shadow-lg !border !border-gray-200`}
        onClick={() => {
          setIsBenchmarkControlOpen(!isBenchmarkControlOpen);
        }}
      >{t("set-benchmark")}</button>
      {isBenchmarkControlOpen && (
        <div className={`
          absolute start-0 top-full mt-2
          ${isMobile ? 'w-[calc(100vw-2rem)] max-w-[16rem]' : 'w-[430px] '} 
          flex flex-col rounded-xl border border-slate-100 shadow-2xl bg-white z-[200]
          ${isMobile ? 'p-3 gap-2' : 'p-4 gap-3'}
          max-h-[62vh] overflow-y-auto statistics-popup-scroll
        `}>
          {benchmarks
            .filter(benchmark => !!benchmark?.title)
            .map(benchmark => {
              return (
                <div 
                  className="grid grid-cols-[1fr_auto] gap-4 items-center py-1.5 border-b border-slate-50 last:border-0" 
                  key={benchmark?.title}
                >
                  <label className="text-sm font-semibold text-slate-700 capitalize leading-tight">
                    {benchmark?.title?.split('_')?.join(' ')}
                  </label>
                  <input
                    type="number"
                    className="w-28 sm:w-32 p-2 border border-slate-200 rounded-lg outline-none text-sm font-mono text-center transition-all focus:border-[#115740] focus:ring-2 focus:ring-[#115740]/10 bg-slate-50/50 hover:bg-white focus:bg-white"
                    placeholder="—"
                    value={benchmark?.value}
                    name={benchmark?.title}
                    onChange={handleBenchmarkChange}
                  />
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};
export default BenchmarkControl;
