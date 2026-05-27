import { useState, useCallback } from 'react';
import apiRequest from '../../../../services/apiRequest';
import urls from '../../../../urls.json';

export interface ReportAIChatMessage {
  content: string;
  isUser: boolean;
  isBlocked?: boolean;
  timestamp: string;
}

interface ChatApiResponse {
  answer: string;
  blocked: boolean;
  reason: string;
}

interface WrappedChatApiResponse {
  data?: {
    data?: ChatApiResponse;
  };
}

export interface UseReportAIChatReturn {
  messages: ReportAIChatMessage[];
  isLoading: boolean;
  sendMessage: (question: string) => Promise<void>;
  clearMessages: () => void;
}

export function useReportAIChat(): UseReportAIChatReturn {
  const [messages, setMessages] = useState<ReportAIChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(
    async (question: string): Promise<void> => {
      const userMessage: ReportAIChatMessage = {
        content: question,
        isUser: true,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const response = (await apiRequest({
          url: urls.chat,
          method: 'post',
          body: { question },
          isAuthRequest: true,
        })) as WrappedChatApiResponse;
        const data = response.data?.data;

        const botMessage: ReportAIChatMessage = {
          content: data?.blocked ? data.reason || '' : data?.answer || '',
          isUser: false,
          isBlocked: data?.blocked,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, botMessage]);
      } catch (error) {
        console.error('Report AI chat error:', error);
        const errorMessage: ReportAIChatMessage = {
          content:
            'Sorry, something went wrong. Please try again later.',
          isUser: false,
          isBlocked: false,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearMessages = useCallback((): void => {
    setMessages([]);
  }, []);

  return { messages, isLoading, sendMessage, clearMessages };
}
