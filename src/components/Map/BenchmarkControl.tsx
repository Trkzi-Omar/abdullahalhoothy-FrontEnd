import { useRef } from 'react';
import { useCatalogContext } from '../../context/CatalogContext';
import { useUIContext } from '../../context/UIContext';
import { useClickOutside } from '../../hooks/useClickOutside';

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

  if (polygons.length === 0) return null;

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
      >
        Set Benchmark
      </button>
      {isBenchmarkControlOpen && (
        <div className={`
          absolute left-0 top-full mt-2
          ${isMobile ? 'w-[calc(100vw-2rem)] max-w-[16rem]' : 'w-[430px] '} 
          flex flex-col rounded-md shadow-lg bg-white z-[200]
          ${isMobile ? 'p-3 gap-2  ' : 'p-4 gap-4'}
          max-h-[62vh] overflow-y-auto
        `}>
          {benchmarks
            .filter(benchmark => !!benchmark?.title)
            .map(benchmark => {
              return (
                <div className={`flex justify-between items-center ${isMobile ? 'gap-2' : 'gap-6'} ${!isMobile ? 'sm:gap-8' : ''}`} key={benchmark?.title}>
                  <label className={`${isMobile ? 'text-xs' : 'text-sm sm:text-base'} font-medium text-gray-700 capitalize flex-shrink-0 ${isMobile ? 'min-w-0 flex-1' : ''}`}>
                    {benchmark?.title?.split('_')?.join(' ')}
                  </label>
                  <input
                    type="number"
                    className={`${isMobile ? 'w-20 text-xs' : 'w-32 sm:w-40 md:w-48'} p-1 sm:p-2 border border-gray-300 rounded-md flex-shrink-0 text-sm sm:text-base`}
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
