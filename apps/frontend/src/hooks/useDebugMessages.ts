/**
 * Debug Messages Hook
 * Manages debug message state and operations
 */

import { useState, useCallback } from 'react';
import type { DebugMessage } from '../components/DebugConsole';
import { createDebugMessage } from '../utils/debug-message-utils';
import { DebugLogger } from '../services/debug-logger';

const MAX_MESSAGES = 100;

export function useDebugMessages(): {
  messages: DebugMessage[];
  addMessage: (level: DebugMessage['level'], message: string, data?: unknown) => void;
  clearMessages: () => void;
  removeMessage: (id: string) => void;
} {
  const [messages, setMessages] = useState<DebugMessage[]>([]);

  const addMessage = useCallback((level: DebugMessage['level'], message: string, data?: unknown): void => {
    const newMessage = createDebugMessage(level, message, data);
    setMessages(prev => [newMessage, ...prev].slice(0, MAX_MESSAGES));
    
    // Also send to backend if error
    if (level === 'error' && data && typeof data === 'object') {
      DebugLogger.logError(message, { frontend: true, ...data });
    } else if (level === 'error') {
      DebugLogger.logError(message, { frontend: true, data });
    }
  }, []);

  const clearMessages = useCallback((): void => {
    setMessages([]);
  }, []);

  const removeMessage = useCallback((id: string): void => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  return {
    messages,
    addMessage,
    clearMessages,
    removeMessage
  };
}