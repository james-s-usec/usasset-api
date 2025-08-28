import React, { useState, useCallback, useEffect } from 'react';
import type { DebugMessage } from '../components/DebugConsole';
import { DebugLogger } from '../services/debug-logger';
import { DebugContext } from './debug-context';

interface DebugProviderProps {
  children: React.ReactNode;
}

export const DebugProvider = ({ children }: DebugProviderProps) => {
  const [messages, setMessages] = useState<DebugMessage[]>([]);

  const addMessage = useCallback(async (level: DebugMessage['level'], message: string, data?: unknown) => {
    const newMessage: DebugMessage = {
      id: Date.now().toString(),
      level,
      message,
      timestamp: new Date(),
      data
    };
    
    // Add to UI immediately
    setMessages(prev => [newMessage, ...prev].slice(0, 100)); // Keep last 100 messages
    
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
    } catch (error) {
      // If database save fails, don't add error to UI to avoid infinite loop
      console.warn('Failed to save debug message to database:', error);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    addMessage('info', 'Debug messages cleared');
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

    // Add initial startup message
    addMessage('info', 'Debug system initialized', {
      url: window.location.href,
      userAgent: navigator.userAgent
    });

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [addMessage]);

  const value = {
    messages,
    addMessage,
    clearMessages,
    copyAllDebugInfo
  };

  return (
    <DebugContext.Provider value={value}>
      {children}
    </DebugContext.Provider>
  );
};