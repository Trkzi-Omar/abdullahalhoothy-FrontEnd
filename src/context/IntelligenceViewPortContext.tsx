import { createContext, useContext, useState, ReactNode } from 'react';
import { IntelligenceViewport } from '../types/allTypesAndInterfaces';

interface IntelligenceViewportContextType {
  viewport: IntelligenceViewport | null;
  setViewport: React.Dispatch<React.SetStateAction<IntelligenceViewport | null>>;
  pendingActivation: boolean;
  setPendingActivation: (v: boolean) => void;
  populationSample: boolean;
  setPopulationSample: (v: boolean) => void;
  incomeSample: boolean;
  setIncomeSample: (v: boolean) => void;
}

const IntelligenceViewportContext = createContext<IntelligenceViewportContextType | undefined>(
  undefined
);

export const IntelligenceViewportProvider = ({ children }: { children: ReactNode }) => {
  const [viewport, setViewport] = useState<IntelligenceViewport | null>(null);
  const [pendingActivation, setPendingActivation] = useState(false);
  const [populationSample, setPopulationSample] = useState(false);
  const [incomeSample, setIncomeSample] = useState(false);

  return (
    <IntelligenceViewportContext.Provider value={{ 
      viewport, 
      setViewport, 
      pendingActivation, 
      setPendingActivation, 
      populationSample, 
      setPopulationSample,
      incomeSample,
      setIncomeSample
    }}>
      {children}
    </IntelligenceViewportContext.Provider>
  );
};

export const useIntelligenceViewport = () => {
  const context = useContext(IntelligenceViewportContext);
  if (!context) {
    throw new Error('useIntelligenceViewport must be used within IntelligenceViewportProvider');
  }
  return context;
};