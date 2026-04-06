import { createContext } from 'react';
import { ChatContextType } from '../types';

export const ChatContext = createContext<ChatContextType | undefined>(undefined);
