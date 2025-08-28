import React, { useState, useCallback, useEffect } from 'react';
import type { DebugMessage } from '../components/DebugConsole';
import { DebugLogger } from '../services/debug-logger';
import { LogsApiService, type LogEntry } from '../services/logs-api';
import { DebugContext } from './debug-context';

interface DebugProviderProps {
  children: React.ReactNode;
}

// Convert database LogEntry to UI DebugMessage format
const convertLogEntryToDebugMessage = (logEntry: LogEntry): DebugMessage => ({
  id: logEntry.id,
  level: logEntry.level.toLowerCase() as DebugMessage['level'],
  message: logEntry.message,
  timestamp: new Date(logEntry.created_at),
  data: logEntry.metadata
});

export const DebugProvider = ({ children }: DebugProviderProps) => {
  const [messages, setMessages] = useState<DebugMessage[]>([]);

  // Load from database ONLY when explicitly requested (no auto-loading)
  // This prevents race conditions and infinite loops

  const refreshMessages = useCallback(async () => {
    try {
      const response = await LogsApiService.getLogs(1, 50);
      const debugMessages = response.logs.map(convertLogEntryToDebugMessage);
      setMessages(debugMessages);
    } catch (error) {
      console.warn('Failed to refresh debug messages:', error);
    }
  }, []);

  const addMessage = useCallback(async (level: DebugMessage['level'], message: string, data?: unknown) => {
    const newMessage: DebugMessage = {
      id: Date.now().toString(),
      level,
      message,
      timestamp: new Date(),
      data
    };
    
    // Add to UI immediately for instant feedback
    setMessages(prev => [newMessage, ...prev].slice(0, 100));
    
    // Save to database for persistence
    try {
      if (level === 'error') {
        await DebugLogger.logError(`Global Debug: ${message}`, data, {
          source: 'debug-context',
          uiTimestamp: newMessage.timestamp.toISOString()
        });
      } else {
        await DebugLogger.logInfo(`Global Debug: ${message}`, {
          level,
          debugData: data,
          source: 'debug-context',
          uiTimestamp: newMessage.timestamp.toISOString()
        });
      }
      
      // Note: Manual refresh required for database sync to avoid infinite loops
      
    } catch (error) {
      // If database save fails, don't add error to UI to avoid infinite loop
      console.warn('Failed to save debug message to database:', error);
    }
  }, [refreshMessages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    addMessage('info', 'Debug console messages cleared (database logs unaffected)');
  }, [addMessage]);

  const clearDatabaseLogs = useCallback(async () => {
    try {
      addMessage('info', 'Starting database clear operation...', { step: 'start' });
      
      // Get total count before clearing
      const currentLogs = await LogsApiService.getLogs(1, 1);
      const totalCount = currentLogs.pagination.total;
      
      addMessage('info', `Found ${totalCount} total logs in database`, { totalCount, step: 'count' });
      
      if (totalCount === 0) {
        addMessage('info', 'Database logs already empty', { totalCount: 0 });
        return { message: 'No logs to clear', deletedCount: 0 };
      }

      addMessage('info', 'Calling DELETE /logs endpoint...', { step: 'delete', totalCount });
      
      const response = await LogsApiService.deleteLogs();
      
      addMessage('info', `DELETE response: ${JSON.stringify(response)}`, { 
        step: 'response',
        response,
        totalCount,
        deletedCount: response.deletedCount
      });
      
      // Verify deletion worked
      const afterLogs = await LogsApiService.getLogs(1, 1);
      const remainingCount = afterLogs.pagination.total;
      
      addMessage('info', `Verification: ${remainingCount} logs remaining after delete`, { 
        step: 'verify',
        beforeCount: totalCount,
        deletedCount: response.deletedCount,
        remainingCount
      });
      
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addMessage('error', 'Failed to clear database logs', { 
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }, [addMessage]);

  const copyAllDebugInfo = useCallback(() => {
    try {
      const debugInfo = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        messages: messages,
        summary: {
          totalMessages: messages.length,
          errorCount: messages.filter(m => m.level === 'error').length,
          warnCount: messages.filter(m => m.level === 'warn').length,
          lastError: messages.find(m => m.level === 'error'),
          recentMessages: messages.slice(0, 10)
        },
        performance: {
          memory: (performance as Performance & { memory?: { usedJSSize: number; totalJSSize: number; jsHeapSizeLimit: number } }).memory ? {
            usedJSSize: (performance as Performance & { memory: { usedJSSize: number } }).memory.usedJSSize,
            totalJSSize: (performance as Performance & { memory: { totalJSSize: number } }).memory.totalJSSize,
            jsHeapSizeLimit: (performance as Performance & { memory: { jsHeapSizeLimit: number } }).memory.jsHeapSizeLimit
          } : undefined,
          timing: performance.timing ? {
            loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart,
            domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
          } : undefined
        }
      };
      
      navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
      addMessage('info', 'Complete debug info copied to clipboard', { 
        messageCount: messages.length 
      });
      alert('Complete debug info copied to clipboard!');
    } catch (error) {
      addMessage('error', 'Failed to copy debug info', error);
    }
  }, [messages, addMessage]);

  // Global error handlers
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      addMessage('error', 'Global JavaScript Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      addMessage('error', 'Unhandled Promise Rejection', {
        reason: event.reason instanceof Error ? event.reason.message : String(event.reason),
        stack: event.reason instanceof Error ? event.reason.stack : undefined,
        timestamp: new Date().toISOString()
      });
    };

    // Note: React error boundary errors would be handled by ErrorBoundary components
    // const handleReactError = (error: Error, errorInfo: { componentStack: string }) => {
    //   addMessage('error', 'React Error Boundary', {
    //     message: error.message,
    //     stack: error.stack,
    //     componentStack: errorInfo.componentStack,
    //     timestamp: new Date().toISOString()
    //   });
    // };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Note: Removed auto startup message to prevent memory loops

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [addMessage]);

  const value = {
    messages,
    addMessage,
    clearMessages,
    clearDatabaseLogs,
    copyAllDebugInfo,
    refreshMessages
  };

  return (
    <DebugContext.Provider value={value}>
      {children}
    </DebugContext.Provider>
  );
};