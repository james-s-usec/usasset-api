import { useCallback } from 'react';
import type { LogEntry } from '../services/logs-api';
import type { DebugMessage } from '../components/DebugConsole';
import { copyToClipboard, showCopySuccess, formatError } from '../utils/clipboard-copy';

export interface UseClipboardActionsReturn {
  handleCopyLogsAsJSON: () => void;
  handleCopyDebugInfo: () => void;
}

interface UseClipboardActionsParams {
  logs: LogEntry[];
  debugMessages: DebugMessage[];
  addDebugMessage: (level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: Record<string, unknown>) => void;
}

const buildDebugInfo = (messages: DebugMessage[], logs: LogEntry[]): Record<string, unknown> => {
  const errors = messages.filter((m: DebugMessage) => m.level === 'error');
  return {
    timestamp: new Date().toISOString(),
    debugMessages: messages,
    databaseLogs: logs,
    userAgent: navigator.userAgent,
    url: window.location.href,
    summary: {
      totalDebugMessages: messages.length,
      totalDatabaseLogs: logs.length,
      errorCount: errors.length,
      lastError: errors[0]
    }
  };
};

const handleCopyError = (
  error: unknown, 
  message: string, 
  addDebugMessage: UseClipboardActionsParams['addDebugMessage']
): void => {
  addDebugMessage('error', message, { error: formatError(error) });
};

const copyLogsSuccessHandler = (
  logs: LogEntry[], 
  addDebugMessage: UseClipboardActionsParams['addDebugMessage']
): void => {
  addDebugMessage('info', 'Database logs copied to clipboard', { count: logs.length });
  showCopySuccess('Database logs copied to clipboard!');
};

const copyDebugInfoSuccessHandler = (
  debugMessages: DebugMessage[], 
  logs: LogEntry[],
  addDebugMessage: UseClipboardActionsParams['addDebugMessage']
): void => {
  addDebugMessage('info', 'Complete debug info copied to clipboard', { 
    messagesCount: debugMessages.length,
    logsCount: logs.length 
  });
  showCopySuccess('Complete debug info copied to clipboard!');
};

export const useClipboardActions = ({ 
  logs, 
  debugMessages, 
  addDebugMessage 
}: UseClipboardActionsParams): UseClipboardActionsReturn => {
  
  const handleCopyLogsAsJSON = useCallback((): void => {
    try {
      const jsonData = JSON.stringify(logs, null, 2);
      copyToClipboard(jsonData);
      copyLogsSuccessHandler(logs, addDebugMessage);
    } catch (error) {
      handleCopyError(error, 'Failed to copy database logs', addDebugMessage);
    }
  }, [logs, addDebugMessage]);

  const handleCopyDebugInfo = useCallback((): void => {
    try {
      const debugInfo = buildDebugInfo(debugMessages, logs);
      const jsonData = JSON.stringify(debugInfo, null, 2);
      copyToClipboard(jsonData);
      copyDebugInfoSuccessHandler(debugMessages, logs, addDebugMessage);
    } catch (error) {
      handleCopyError(error, 'Failed to copy debug info', addDebugMessage);
    }
  }, [debugMessages, logs, addDebugMessage]);

  return {
    handleCopyLogsAsJSON,
    handleCopyDebugInfo,
  };
};