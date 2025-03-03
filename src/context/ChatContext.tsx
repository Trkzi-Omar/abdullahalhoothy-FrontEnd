import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import apiRequest from '../services/apiRequest';
import { Message, ChatContextType, topics } from '../types';
import urls from '../urls.json';
import { useCatalogContext } from './CatalogContext';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { authResponse } = useAuth();
  const { geoPoints } = useCatalogContext();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [topic, setTopic] = useState(topics.DEFAULT);
  const hasGreeted = useRef(false);

  useEffect(() => {
    if (isOpen && !hasGreeted.current) {
      const greetingMessage = {
        content: `Hi, ${authResponse?.displayName || 'there'} how can I help you?`,
        isUser: false,
        timestamp: new Date().toISOString(),
      };

      const timer = setTimeout(() => {
        setMessages(prev => [...prev, greetingMessage]);
        hasGreeted.current = true;
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isOpen, authResponse?.displayName]);

  const sendMessage = async (content: string) => {
    try {
      setIsLoading(true);
      const userMessage = {
        content,
        isUser: true,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMessage]);

      const reqBody = { user_id: authResponse?.localId, prompt: content.trim(), layers: geoPoints };

      const response = await apiRequest({
        url: urls.gradient_color_based_on_zone_llm,
        method: 'post',
        body: reqBody,
        isAuthRequest: true,
      });

      const botMessage = {
        content: response?.data?.reply || 'Sorry, I could not process your request.',
        isUser: false,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChat = () => setIsOpen(prev => !prev);
  const closeChat = () => setIsOpen(false);

  return (
    <ChatContext.Provider
      value={{ messages, isLoading, isOpen, sendMessage, toggleChat, closeChat, topic, setTopic }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}
