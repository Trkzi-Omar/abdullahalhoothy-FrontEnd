import React, { useEffect, useState } from 'react';
import { useLayerContext } from '../../context/LayerContext';
import { useCatalogContext } from '../../context/CatalogContext';
import { LiaMapMarkedAltSolid } from 'react-icons/lia';
import { MdAttachMoney } from 'react-icons/md';

export const AreaIntelligeneControl: React.FC = () => {
  const {
    switchPopulationLayer,
    switchIncomeLayer,
    refetchPopulationLayer,
    refetchIncomeLayer,
    includePopulation,
    includeIncome,
  } = useLayerContext();
  const [isOpen, setIsOpen] = useState(false);
  const { selectedContainerType } = useCatalogContext();
  const [isPopulationRefetching, setIsPopulationRefetching] = useState(false);
  const [isIncomeRefetching, setIsIncomeRefetching] = useState(false);


  const close = () => setIsOpen(false);

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
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-center
          h-[47px] rounded-md p-2
          bg-gem-gradient border text-gray-200 border-gem/20 
          shadow-sm transition-all duration-200
          hover:bg-gray-100
          ${includeIncome || includePopulation ? 'bg-gem-green text-white hover:bg-[#0d4432]' : ''}
        `}
        title={'Area Intelligence'}
      >
        <div className="flex items-center justify-center w-full h-full">
          <LiaMapMarkedAltSolid
            size={22}
            className={`
              text-current
              ${includePopulation || includeIncome ? 'text-white' : ''}
              m-2
            `}
          />
          Area Intelligence
        </div>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 min-w-[22rem] z-50">
          <div
            className={`
              relative flex flex-col p-4 rounded-lg border 
              transition-all duration-200 ease-in-out
              text-gray-100 bg-gem-gradient border-gem-green/20
              aria-disabled:opacity-80 aria-disabled:cursor-not-allowed
            `}
            title={'Activate area intelligence'}
          >
            <div className="font-semibold text-white">Area Intelligence</div>

            <label
              htmlFor="population-toggle-map"
              className={`
                flex items-center justify-between 
                border-t border-gem/20 mt-2 pt-2
                bg-white/95 p-3 rounded-md cursor-pointer
              `}
            >
              <div className="flex items-center gap-2">
                <div className="text-gem">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    className="min-w-5"
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
                <div className="flex flex-col">
                  <label className="font-medium text-gem">Population Intelligence</label>
                  <p className="text-sm text-gem/80 mt-1">Enable smart population data</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
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
                      w-14 h-7 bg-gray-200 
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
                      after:h-6 
                      after:w-6 
                      after:transition-all
                      peer-checked:after:translate-x-[28px]
                      peer-checked:after:border-white
                    `}
                  />
                </div>

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
              </div>
            </label>

            <label
              htmlFor="income-toggle-map"
              className={`
                flex items-center justify-between 
                border-t border-gem/20 mt-2 pt-2
                bg-white/95 p-3 rounded-md cursor-pointer
              `}
            >
              <div className="flex items-center gap-2">
                <div className="text-gem">
                  <MdAttachMoney size={24} />
                </div>
                <div className="flex flex-col">
                  <label className="font-medium text-gem">Income Intelligence</label>
                  <p className="text-sm text-gem/80 mt-1">Enable smart income data</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
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
                      w-14 h-7 bg-gray-200 
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
                      after:h-6 
                      after:w-6 
                      after:transition-all
                      peer-checked:after:translate-x-[28px]
                      peer-checked:after:border-white
                    `}
                  />
                </div>

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
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
