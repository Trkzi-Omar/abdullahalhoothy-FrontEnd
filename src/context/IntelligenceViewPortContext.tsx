import { createContext, useContext, useState, ReactNode } from 'react';
import { IntelligenceViewport } from '../types/allTypesAndInterfaces';

interface IntelligenceViewportContextType {
  viewport: IntelligenceViewport | null;
  setViewport: (v: IntelligenceViewport | null) => void;
}

const IntelligenceViewportContext = createContext<IntelligenceViewportContextType | undefined>(
  undefined
);

export const IntelligenceViewportProvider = ({ children }: { children: ReactNode }) => {
  const [viewport, setViewport] = useState<IntelligenceViewport | null>(null);

  return (
    <IntelligenceViewportContext.Provider value={{ viewport, setViewport }}>
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