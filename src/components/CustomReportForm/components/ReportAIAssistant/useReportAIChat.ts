import { useState, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';

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

export interface UseReportAIChatReturn {
  messages: ReportAIChatMessage[];
  isLoading: boolean;
  sendMessage: (question: string) => Promise<void>;
  clearMessages: () => void;
}

const CHAT_URL =
  import.meta.env.VITE_REPORT_AI_CHAT_URL || 'http://37.27.195.216:9000/chat';

export function useReportAIChat(): UseReportAIChatReturn {
  const [messages, setMessages] = useState<ReportAIChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { authResponse } = useAuth();

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
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (authResponse && 'idToken' in authResponse) {
          headers['Authorization'] = `Bearer ${authResponse.idToken}`;
        }

        const response = await fetch(CHAT_URL, {
          method: 'POST',
          headers,
          body: JSON.stringify({ question }),
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data: ChatApiResponse = await response.json();

        const botMessage: ReportAIChatMessage = {
          content: data.blocked ? data.reason : data.answer,
          isUser: false,
          isBlocked: data.blocked,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, botMessage]);
      } catch {
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
    [authResponse]
  );

  const clearMessages = useCallback((): void => {
    setMessages([]);
  }, []);

  return { messages, isLoading, sendMessage, clearMessages };
}
