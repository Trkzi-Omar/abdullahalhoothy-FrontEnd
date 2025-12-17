import React, { useEffect, useState, useRef } from 'react';
import { useLayerContext } from '../../context/LayerContext';
import { useCatalogContext } from '../../context/CatalogContext';
import { LiaMapMarkedAltSolid } from 'react-icons/lia';
import { MdAttachMoney } from 'react-icons/md';
import { useIntelligenceViewport } from '../../context/IntelligenceViewPortContext';
import { useClickOutside } from '../../hooks/useClickOutside';

export const AreaIntelligeneControl: React.FC = () => {
  const {
    switchPopulationLayer,
    switchIncomeLayer,
    refetchPopulationLayer,
    refetchIncomeLayer,
    includePopulation,
    includeIncome,
  } = useLayerContext();
  const {
    populationSample,
    setPopulationSample,
    incomeSample,
    setIncomeSample,
  } = useIntelligenceViewport();
  const [isOpen, setIsOpen] = useState(false);
  const { selectedContainerType } = useCatalogContext();
  const [isPopulationRefetching, setIsPopulationRefetching] = useState(false);
  const [isIncomeRefetching, setIsIncomeRefetching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = () => setIsOpen(false);

  // Close dropdown when clicking outside
  useClickOutside(containerRef, () => {
    if (isOpen) {
      close();
    }
  });

  useEffect(() => {
    close();
  }, [selectedContainerType]);

  const handlePopulationRefetch = async () => {
    setIsPopulationRefetching(true);
    try {
      await refetchPopulationLayer();
    } finally {
      setTimeout(() => setIsPopulationRefetching(false), 1000);
    }
  };

  const handleIncomeRefetch = async () => {
    setIsIncomeRefetching(true);
    try {
      await refetchIncomeLayer();
    } finally {
      setTimeout(() => setIsIncomeRefetching(false), 1000);
    }
  };

  return (
    <div ref={containerRef} className="relative z-[101]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-center
          h-[40px] sm:h-[47px] text-xs sm:text-base rounded-md p-1.5 sm:p-2
          bg-gem-gradient border text-gray-200 border-gem/20 
          shadow-lg transition-all duration-200
          hover:bg-gray-100 min-w-[40px] sm:min-w-0
          ${includeIncome || includePopulation ? 'bg-gem-green text-white hover:bg-[#0d4432]' : ''}
        `}
        title={'Area Intelligence'}
      >
        <div className="flex items-center justify-center w-full h-full">
          <LiaMapMarkedAltSolid
            size={20}
            className={`
              text-current sm:w-[22px] sm:h-[22px]
              ${includePopulation || includeIncome ? 'text-white' : ''}
              m-0.5 sm:m-2
            `}
          />
          <span className="hidden sm:inline">Area Intelligence</span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-[min(calc(100vw-1rem),20rem)] sm:min-w-[26rem] sm:max-w-[42rem] z-50">
          <div
            className={`
              relative flex flex-col p-3 sm:p-4 rounded-lg border 
              transition-all duration-200 ease-in-out
              text-gray-100 bg-gem-gradient border-gem-green/20
              aria-disabled:opacity-80 aria-disabled:cursor-not-allowed
            `}
            title={'Activate area intelligence'}
          >
            <div className="font-semibold text-white text-sm sm:text-base">Area Intelligence</div>

            <label
              htmlFor="population-toggle-map"
              className={`
                flex items-center justify-between 
                border-t border-gem/20 mt-2 pt-2
                bg-white/95 p-2 sm:p-3 rounded-md cursor-pointer
                gap-1.5 sm:gap-1
              `}
            >
              <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                <div className="text-gem flex-shrink-0">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    className="sm:w-5 sm:h-5 min-w-[18px] sm:min-w-5"
                  >
                    <g>
                      <path
                        d="M18 7.16C17.94 7.15 17.87 7.15 17.81 7.16C16.43 7.11 15.33 5.98 15.33 4.58C15.33 3.15 16.48 2 17.91 2C19.34 2 20.49 3.16 20.49 4.58C20.48 5.98 19.38 7.11 18 7.16Z"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        stroke="currentColor"
                      />
                      <path
                        d="M16.9699 14.44C18.3399 14.67 19.8499 14.43 20.9099 13.72C22.3199 12.78 22.3199 11.24 20.9099 10.3C19.8399 9.59004 18.3099 9.35003 16.9399 9.59003"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        stroke="currentColor"
                      />
                      <path
                        d="M5.96998 7.16C6.02998 7.15 6.09998 7.15 6.15998 7.16C7.53998 7.11 8.63998 5.98 8.63998 4.58C8.63998 3.15 7.48998 2 6.05998 2C4.62998 2 3.47998 3.16 3.47998 4.58C3.48998 5.98 4.58998 7.11 5.96998 7.16Z"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        stroke="currentColor"
                      />
                      <path
                        d="M6.99994 14.44C5.62994 14.67 4.11994 14.43 3.05994 13.72C1.64994 12.78 1.64994 11.24 3.05994 10.3C4.12994 9.59004 5.65994 9.35003 7.02994 9.59003"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        stroke="currentColor"
                      />
                      <path
                        d="M12 14.63C11.94 14.62 11.87 14.62 11.81 14.63C10.43 14.58 9.32996 13.45 9.32996 12.05C9.32996 10.62 10.48 9.46997 11.91 9.46997C13.34 9.46997 14.49 10.63 14.49 12.05C14.48 13.45 13.38 14.59 12 14.63Z"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        stroke="currentColor"
                      />
                      <path
                        d="M9.08997 17.78C7.67997 18.72 7.67997 20.26 9.08997 21.2C10.69 22.27 13.31 22.27 14.91 21.2C16.32 20.26 16.32 18.72 14.91 17.78C13.32 16.72 10.69 16.72 9.08997 17.78Z"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        stroke="currentColor"
                      />
                    </g>
                  </svg>
                </div>
                <div className="flex flex-col min-w-0">
                  <label className="font-medium text-gem text-xs sm:text-sm">Population Intelligence</label>
                  <p className="text-xs sm:text-sm text-gem/80 mt-1 ">Enable smart population data</p>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <button
                  onClick={handlePopulationRefetch}
                  className="text-gem-green hover:text-gem-green/80 p-1"
                  title="Refresh population data"
                  disabled={isPopulationRefetching}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={isPopulationRefetching ? 'animate-spin' : ''}
                  >
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                  </svg>
                </button>
                <div className="flex bg-gray-100 rounded p-0.5 border border-gray-200 flex-shrink-0" onClick={(e) => e.preventDefault()}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPopulationSample(true);
                    }}
                    className={`
                      px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs rounded transition-all duration-200
                      ${populationSample 
                        ? 'bg-white shadow-sm text-gem-green font-medium' 
                        : 'text-gray-500 hover:text-gray-700'
                      }
                    `}
                  >
                    Sample
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPopulationSample(false);
                    }}
                    className={`
                      px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs rounded transition-all duration-200
                      ${!populationSample 
                        ? 'bg-white shadow-sm text-gem-green font-medium' 
                        : 'text-gray-500 hover:text-gray-700'
                      }
                    `}
                  >
                    Full
                  </button>
                </div>
                <div className="relative flex-shrink-0 ml-1 sm:ml-0">
                  <input
                    id="population-toggle-map"
                    type="checkbox"
                    checked={includePopulation}
                    onChange={() => {
                      switchPopulationLayer();
                    }}
                    className="sr-only peer"
                  />
                  <div
                    className={`
                      cursor-pointer
                      w-12 h-6 sm:w-14 sm:h-7 bg-gray-200 
                      peer-focus:outline-none peer-focus:ring-4 
                      peer-focus:ring-gem-green/20 
                      rounded-full peer
                      peer-checked:bg-gem-green
                      after:content-['']
                      after:absolute 
                      after:top-[2px] 
                      after:left-[2px]
                      after:bg-white 
                      after:border-gray-300 
                      after:border 
                      after:rounded-full
                      after:h-5 
                      after:w-5 
                      after:transition-all
                      peer-checked:after:translate-x-[24px] sm:peer-checked:after:translate-x-[28px]
                      peer-checked:after:border-white
                    `}
                  />
                </div>
              </div>
            </label>

            <label
              htmlFor="income-toggle-map"
              className={`
                flex items-center justify-between 
                border-t border-gem/20 mt-2 pt-2
                bg-white/95 p-2 sm:p-3 rounded-md cursor-pointer
                gap-1.5 sm:gap-0
              `}
            >
              <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                <div className="text-gem flex-shrink-0">
                  <MdAttachMoney size={20} className="sm:w-6 sm:h-6" />
                </div>
                <div className="flex flex-col min-w-0">
                  <label className="font-medium text-gem text-xs sm:text-sm">Income Intelligence</label>
                  <p className="text-xs sm:text-sm text-gem/80 mt-1 ">Enable smart income data</p>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <button
                  onClick={handleIncomeRefetch}
                  className="text-gem-green hover:text-gem-green/80 p-1"
                  title="Refresh income data"
                  disabled={isIncomeRefetching}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={isIncomeRefetching ? 'animate-spin' : ''}
                  >
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                  </svg>
                </button>
                <div className="flex bg-gray-100 rounded p-0.5 border border-gray-200 flex-shrink-0" onClick={(e) => e.preventDefault()}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIncomeSample(true);
                    }}
                    className={`
                      px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs rounded transition-all duration-200
                      ${incomeSample 
                        ? 'bg-white shadow-sm text-gem-green font-medium' 
                        : 'text-gray-500 hover:text-gray-700'
                      }
                    `}
                  >
                    Sample
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIncomeSample(false);
                    }}
                    className={`
                      px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs rounded transition-all duration-200
                      ${!incomeSample 
                        ? 'bg-white shadow-sm text-gem-green font-medium' 
                        : 'text-gray-500 hover:text-gray-700'
                      }
                    `}
                  >
                    Full
                  </button>
                </div>
                <div className="relative flex-shrink-0 ml-1 sm:ml-0">
                  <input
                    id="income-toggle-map"
                    type="checkbox"
                    checked={includeIncome}
                    onChange={() => {
                      switchIncomeLayer();
                    }}
                    className="sr-only peer"
                  />
                  <div
                    className={`
                      cursor-pointer
                      w-12 h-6 sm:w-14 sm:h-7 bg-gray-200 
                      peer-focus:outline-none peer-focus:ring-4 
                      peer-focus:ring-gem-green/20 
                      rounded-full peer
                      peer-checked:bg-gem-green
                      after:content-['']
                      after:absolute 
                      after:top-[2px] 
                      after:left-[2px]
                      after:bg-white 
                      after:border-gray-300 
                      after:border 
                      after:rounded-full
                      after:h-5 
                      after:w-5 
                      after:transition-all
                      peer-checked:after:translate-x-[24px] sm:peer-checked:after:translate-x-[28px]
                      peer-checked:after:border-white
                    `}
                  />
                </div>
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

