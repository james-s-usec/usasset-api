import { createContext } from 'react';
import type { DebugMessage } from '../components/DebugConsole';

export interface DebugContextType {
  messages: DebugMessage[];
  addMessage: (level: DebugMessage['level'], message: string, data?: unknown) => void;
  clearMessages: () => void;
  copyAllDebugInfo: () => void;
}

export const DebugContext = createContext<DebugContextType | null>(null);