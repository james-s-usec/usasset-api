import { createContext } from 'react';
import type { DebugMessage } from '../components/DebugConsole';

export interface DebugContextType {
  messages: DebugMessage[];
  addMessage: (level: DebugMessage['level'], message: string, data?: unknown) => void;
  clearMessages: () => void;
  clearDatabaseLogs: () => Promise<{ message: string; deletedCount: number }>;
  copyAllDebugInfo: () => void;
  refreshMessages: () => Promise<void>;
}

export const DebugContext = createContext<DebugContextType | null>(null);