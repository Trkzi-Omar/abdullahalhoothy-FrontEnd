import type { FetchDatasetResponse } from './allTypesAndInterfaces';

export type DatasetFeature = FetchDatasetResponse['features'][number];

export type FetchDatasetData = FetchDatasetResponse & {
  next_page_token?: string;
  layer_id: string;
  bknd_dataset_id: string;
};

export type CustomFetchBody = Record<string, unknown> & {
  country_name?: string;
  selectedCountry?: string;
  city_name?: string;
  selectedCity?: string;
  layer_name?: string;
  boolean_query?: string;
  action?: string;
  search_type?: string;
  points_color?: string;
  excludedTypes?: string[];
  includedTypes?: string[];
  page_token?: string;
  bottom_lng?: number;
  bottom_lat?: number;
  top_lng?: number;
  top_lat?: number;
};

export type ViewportIntelligenceResponse = {
  features: FetchDatasetResponse['features'];
  metadata?: { color?: string };
};

export type IntelligenceFeature = {
  properties: {
    Population_Count: number;
    Male_Population: number;
    Female_Population: number;
    Median_Age_Total: number;
    Median_Age_Female: number;
    Population_Density_KM2: number;
  };
};

export type ApiErrorWithResponse = {
  response?: {
    data?: {
      detail?: string;
    };
  };
};

export type IntelligentLayerCandidate = {
  is_intelligent?: unknown;
  bknd_dataset_id?: unknown;
};
