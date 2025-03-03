export interface Message {
  content: string;
  isUser: boolean;
  timestamp: string;
}

export interface ChatContextType {
  messages: Message[];
  isLoading: boolean;
  isOpen: boolean;
  sendMessage: (content: string) => Promise<void>;
  toggleChat: () => void;
  closeChat: () => void;
  topic: topics;
  setTopic: React.Dispatch<React.SetStateAction<topics>>;
}

export enum topics {
  DEFAULT,
  DATASET,
  RECOLOR,
}
