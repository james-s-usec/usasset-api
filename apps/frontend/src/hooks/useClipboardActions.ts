import { useCallback } from 'react';
import type { LogEntry } from '../services/logs-api';
import type { DebugMessage } from '../components/DebugConsole';

export interface UseClipboardActionsReturn {
  handleCopyLogsAsJSON: () => void;
  handleCopyDebugInfo: () => void;
}

interface UseClipboardActionsParams {
  logs: LogEntry[];
  debugMessages: DebugMessage[];
  addDebugMessage: (level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: unknown) => void;
}

export const useClipboardActions = ({ 
  logs, 
  debugMessages, 
  addDebugMessage 
}: UseClipboardActionsParams): UseClipboardActionsReturn => {
  
  const handleCopyLogsAsJSON = useCallback(() => {
    try {
      const jsonData = JSON.stringify(logs, null, 2);
      navigator.clipboard.writeText(jsonData);
      addDebugMessage('info', 'Database logs copied to clipboard', { count: logs.length });
      alert('Database logs copied to clipboard!');
    } catch (error) {
      addDebugMessage('error', 'Failed to copy database logs', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }, [logs, addDebugMessage]);

  const handleCopyDebugInfo = useCallback(() => {
    try {
      const debugInfo = {
        timestamp: new Date().toISOString(),
        debugMessages: debugMessages,
        databaseLogs: logs,
        userAgent: navigator.userAgent,
        url: window.location.href,
        summary: {
          totalDebugMessages: debugMessages.length,
          totalDatabaseLogs: logs.length,
          errorCount: debugMessages.filter((m: DebugMessage) => m.level === 'error').length,
          lastError: debugMessages.find((m: DebugMessage) => m.level === 'error')
        }
      };
      
      const jsonData = JSON.stringify(debugInfo, null, 2);
      navigator.clipboard.writeText(jsonData);
      addDebugMessage('info', 'Complete debug info copied to clipboard', { 
        messagesCount: debugMessages.length,
        logsCount: logs.length 
      });
      alert('Complete debug info copied to clipboard! You can paste this to share all error details.');
    } catch (error) {
      addDebugMessage('error', 'Failed to copy debug info', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }, [debugMessages, logs, addDebugMessage]);

  return {
    handleCopyLogsAsJSON,
    handleCopyDebugInfo,
  };
};