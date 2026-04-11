export interface Message {
  content: string;
  isUser: boolean;
  timestamp: string;
}

export interface FetchDatasetBody {
  action?: string;
  boolean_query?: string;
  city_name?: string;
  country_name?: string;
  [key: string]: unknown;
}

export interface RecolorBody {
  color_grid_choice?: string[];
  change_layer_id?: string;
  change_layer_name?: string;
  based_on_layer_id?: string;
  based_on_layer_name?: string;
  coverage_property?: string;
  coverage_value?: number | string;
  change_layer_new_color?: string;
  change_layer_orginal_color?: string;
  color_based_on?: string;
  list_names?: string[];
  threshold?: number | string;
  user_id?: string;
}

export interface ChatContextType {
  messages: ChatMessage[];
  isLoading: boolean;
  isOpen: boolean;
  sendMessage: (content: string) => Promise<void>;
  toggleChat: () => void;
  closeChat: () => void;
  clearChat: () => void;
  applyGradientColor: (endpointOrResponseData: string | GradientColorResponse, body?: RecolorBody) => Promise<void>;
  takeAction: () => void;
  fetchDataset: (endpoint: string, body: FetchDatasetBody) => Promise<unknown>;
  topic: topics;
  setTopic: (topic: topics) => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export interface LlmGradientColorResponse {
  is_valid: boolean;
  reason?: string | null;
  suggestions?: string[] | null;
  endpoint?: string | null;
  body?: RecolorBody | null;
}

export interface LlmFetchDatasetResponse {
  is_valid: boolean | string;
  query: string;
  reason?: string | null;
  suggestions?: string[] | null;
  endpoint?: string | null;
  cost: string;
  body?: FetchDatasetBody | null;
}
export interface ChatMessage {
  content: string;
  isUser: boolean;
  timestamp: string;
  responseData?: LlmGradientColorResponse | LlmFetchDatasetResponse | GradientColorResponse;
}

export enum topics {
  DEFAULT,
  DATASET,
  RECOLOR,
}

export enum llms {
  FETCH = 'process_llm_query',
  RECOLOR = 'recolor_based_llm',
}

export interface GradientColorResponse {
  is_valid: boolean;
  reason?: string | null;
  suggestions?: string[] | null;
  endpoint?: string | null;
  body?: RecolorBody | null;
}
