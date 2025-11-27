import { createContext, useContext, useState, ReactNode } from 'react';
import { IntelligenceViewport } from '../types/allTypesAndInterfaces';

interface IntelligenceViewportContextType {
  viewport: IntelligenceViewport | null;
  setViewport: (v: IntelligenceViewport | null) => void;
  pendingActivation: boolean;
  setPendingActivation: (v: boolean) => void;
}

const IntelligenceViewportContext = createContext<IntelligenceViewportContextType | undefined>(
  undefined
);

export const IntelligenceViewportProvider = ({ children }: { children: ReactNode }) => {
  const [viewport, setViewport] = useState<IntelligenceViewport | null>(null);
  const [pendingActivation, setPendingActivation] = useState(false);

  return (
    <IntelligenceViewportContext.Provider value={{ viewport, setViewport, pendingActivation, setPendingActivation }}>
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