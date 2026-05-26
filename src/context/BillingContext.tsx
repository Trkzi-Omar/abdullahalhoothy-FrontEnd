/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { t } from '../i18n';

export type ReportTier = 'basic' | 'standard' | 'premium' | 'single_location_premium' | '';

export interface ReportCartItem {
  report: Exclude<ReportTier, ''>;
  country_name: string;
  city_name: string;
  report_potential_business_type: string;
}

export function getReportCartItemKey(item: ReportCartItem): string {
  return [
    item.report,
    item.country_name.trim().toLowerCase(),
    item.city_name.trim().toLowerCase(),
    item.report_potential_business_type.trim().toLowerCase(),
  ].join('|');
}

export interface CheckoutState {
  country_name: string;
  city_name: string;
  datasets: string[];
  intelligences: string[];
  reports: ReportCartItem[];
  report: ReportTier;
  report_potential_business_type: string;
}

type CheckoutAction =
  | { type: 'setCountry'; payload: string }
  | { type: 'setCity'; payload: string }
  | { type: 'toggleDataset'; payload: string }
  | { type: 'toggleIntelligence'; payload: 'Income' | 'Population' | 'Real Estate' }
  | { type: 'setReport'; payload: ReportTier }
  | { type: 'toggleReportInCart'; payload: ReportCartItem }
  | { type: 'removeReportFromCart'; payload: string }
  | { type: 'setReportPotentialBusinessType'; payload: string }
  | { type: 'clearDatasets' }
  | { type: 'clearReports' }
  | {
      type: 'initializeAllItems';
      payload: {
        datasets: string[];
        intelligences: string[];
        report: ReportTier;
        reports?: ReportCartItem[];
      };
    }
  | { type: 'reset' };

const initialCheckoutState: CheckoutState = {
  country_name: '',
  city_name: '',
  datasets: [],
  intelligences: [],
  reports: [],
  report: '',
  report_potential_business_type: '',
};

function checkoutReducer(state: CheckoutState, action: CheckoutAction): CheckoutState {
  switch (action.type) {
    case 'setCountry': {
      return {
        ...state,
        country_name: action.payload,
        report: '',
      };
    }
    case 'setCity': {
      return { ...state, city_name: action.payload, report: '' };
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
    case 'toggleReportInCart': {
      const reportItem = action.payload;
      const itemKey = getReportCartItemKey(reportItem);
      const exists = state.reports.some(existing => getReportCartItemKey(existing) === itemKey);
      return {
        ...state,
        reports: exists
          ? state.reports.filter(existing => getReportCartItemKey(existing) !== itemKey)
          : [...state.reports, reportItem],
      };
    }
    case 'removeReportFromCart': {
      return {
        ...state,
        reports: state.reports.filter(existing => getReportCartItemKey(existing) !== action.payload),
      };
    }
    case 'setReportPotentialBusinessType': {
      return { ...state, report_potential_business_type: action.payload };
    }
    case 'clearDatasets': {
      return { ...state, datasets: [] };
    }
    case 'clearReports': {
      return { ...state, reports: [] };
    }
    case 'initializeAllItems': {
      return {
        ...state,
        datasets: action.payload.datasets,
        intelligences: action.payload.intelligences,
        reports: action.payload.reports ?? state.reports,
        report: action.payload.report,
      };
    }
    case 'reset': {
      return {
        ...initialCheckoutState,
        // city and country won't be reset
        city_name: state.city_name,
        country_name: state.country_name,
        report_potential_business_type: state.report_potential_business_type,
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
    throw new Error(t("usebillingcontext-must-be-used-within-a-billingprovider"));
  }
  return context;
}
