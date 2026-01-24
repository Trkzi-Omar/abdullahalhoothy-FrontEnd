import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export type ReportTier = 'basic' | 'standard' | 'premium' | '';

export interface CheckoutState {
  country_name: string;
  city_name: string;
  datasets: string[];
  intelligences: string[]; // Values: 'Income' | 'Population'
  report: ReportTier;
}

type CheckoutAction =
  | { type: 'setCountry'; payload: string }
  | { type: 'setCity'; payload: string }
  | { type: 'toggleDataset'; payload: string }
  | { type: 'toggleIntelligence'; payload: 'Income' | 'Population' }
  | { type: 'setReport'; payload: ReportTier }
  | { type: 'clearDatasets' }
  | {
      type: 'initializeAllItems';
      payload: { datasets: string[]; intelligences: string[]; report: ReportTier };
    }
  | { type: 'reset' };

const initialCheckoutState: CheckoutState = {
  country_name: '',
  city_name: '',
  datasets: [],
  intelligences: [],
  report: '',
};

function checkoutReducer(state: CheckoutState, action: CheckoutAction): CheckoutState {
  switch (action.type) {
    case 'setCountry': {
      return {
        ...state,
        country_name: action.payload,
      };
    }
    case 'setCity': {
      return { ...state, city_name: action.payload };
    }
    case 'toggleDataset': {
      const dataset = action.payload;
      const exists = state.datasets.includes(dataset);
      return {
        ...state,
        datasets: exists ? state.datasets.filter(d => d !== dataset) : [...state.datasets, dataset],
      };
    }
    case 'toggleIntelligence': {
      const intelligence = action.payload;
      const exists = state.intelligences.includes(intelligence);
      return {
        ...state,
        intelligences: exists
          ? state.intelligences.filter(i => i !== intelligence)
          : [...state.intelligences, intelligence],
      };
    }
    case 'setReport': {
      return { ...state, report: action.payload };
    }
    case 'clearDatasets': {
      return { ...state, datasets: [] };
    }
    case 'initializeAllItems': {
      return {
        ...state,
        datasets: action.payload.datasets,
        intelligences: action.payload.intelligences,
        report: action.payload.report,
      };
    }
    case 'reset': {
      return {
        ...initialCheckoutState,
        // city and country won't be reset
        city_name: state.city_name,
        country_name: state.country_name,
      };
    }
    default:
      return state;
  }
}

interface BillingContextType {
  checkout: CheckoutState;
  dispatch: React.Dispatch<CheckoutAction>;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export function BillingProvider({ children }: { children: ReactNode }) {
  const [checkout, dispatch] = useReducer(checkoutReducer, initialCheckoutState);

  return (
    <BillingContext.Provider value={{ checkout, dispatch }}>{children}</BillingContext.Provider>
  );
}

export function useBillingContext() {
  const context = useContext(BillingContext);
  if (context === undefined) {
    throw new Error('useBillingContext must be used within a BillingProvider');
  }
  return context;
}
