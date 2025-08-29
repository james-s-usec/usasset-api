/**
 * Debug Error Handlers Hook
 * Manages global error event listeners
 */

import { useCallback } from 'react';
import type { DebugMessage } from '../components/DebugConsole';

interface ErrorHandlers {
  attachHandlers: () => void;
  detachHandlers: () => void;
}

export function useDebugErrorHandlers(
  addMessage: (level: DebugMessage['level'], message: string, data?: unknown) => void
): ErrorHandlers {
  
  const handleGlobalError = useCallback((event: ErrorEvent) => {
    addMessage('error', 'Global JavaScript Error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
      timestamp: new Date().toISOString()
    });
  }, [addMessage]);

  const handleUnhandledRejection = useCallback((event: PromiseRejectionEvent) => {
    addMessage('error', 'Unhandled Promise Rejection', {
      reason: event.reason instanceof Error ? event.reason.message : String(event.reason),
      stack: event.reason instanceof Error ? event.reason.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }, [addMessage]);

  const attachHandlers = useCallback(() => {
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
  }, [handleGlobalError, handleUnhandledRejection]);

  const detachHandlers = useCallback(() => {
    window.removeEventListener('error', handleGlobalError);
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, [handleGlobalError, handleUnhandledRejection]);

  return { attachHandlers, detachHandlers };
}