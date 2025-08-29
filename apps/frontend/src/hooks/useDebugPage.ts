import { useCallback } from 'react';
import { DebugLogger } from '../services/debug-logger';
import { useDebug } from './useDebugHook';
import { useLogsData } from './useLogsData';
import { useClipboardActions } from './useClipboardActions';
import { useGlobalErrorHandlers } from './useGlobalErrorHandlers';
import { useDebugState } from './useDebugState';
import { useDebugMountEffect } from './useDebugEffect';
import { logHookCall } from '../utils/debug';
import type { LogEntry } from '../services/logs-api';
import type { DebugMessage } from '../components/DebugConsole';

export interface UseDebugPageReturn {
  // Data state
  logs: LogEntry[];
  loading: boolean;
  error: string | null;
  debugMessages: DebugMessage[];
  
  // Dialog state
  metadataDialog: {
    open: boolean;
    data: unknown;
    title: string;
  };
  
  // Event handlers
  handleRefresh: () => Promise<void>;
  handleTestUIEvent: () => void;
  handleClearLogs: () => Promise<void>;
  handleCopyLogsAsJSON: () => void;
  handleCopyDebugInfo: () => void;
  handleMetadataDialog: (open: boolean, data?: unknown, title?: string) => void;
  
  // Internal functions
  addDebugMessage: (level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: unknown) => void;
}

export const useDebugPage = (): UseDebugPageReturn => {
  logHookCall('useDebugPage', 'entry')

  // Enhanced state with debug logging
  const [metadataDialog, setMetadataDialog] = useDebugState<{ open: boolean; data: unknown; title: string }>({
    open: false,
    data: null,
    title: ''
  }, {
    name: 'metadataDialog',
    componentName: 'useDebugPage',
    compareFunction: (prev, next) => 
      prev.open === next.open && 
      prev.data === next.data && 
      prev.title === next.title
  });
  
  // Use global debug context for floating console
  const { addMessage: addDebugMessage, messages: debugMessages } = useDebug();
  
  // Logs data management
  const { logs, loading, error, loadLogs, handleRefresh: handleLogsRefresh, handleClearLogs } = useLogsData();
  
  // Clipboard operations
  const { handleCopyLogsAsJSON, handleCopyDebugInfo } = useClipboardActions({
    logs,
    debugMessages,
    addDebugMessage,
  });
  
  // Global error handlers
  useGlobalErrorHandlers({ addDebugMessage });

  // Replace useEffect with debug version
  useDebugMountEffect(() => {
    logHookCall('useDebugPage.mountEffect', 'entry')
    DebugLogger.logUIEvent('DebugPage mounted');
    loadLogs();
    
    return () => {
      logHookCall('useDebugPage.mountEffect', 'cleanup')
    };
  }, {
    name: 'mountEffect',
    componentName: 'useDebugPage'
  });

  const handleRefresh = useCallback(async () => {
    logHookCall('useDebugPage.handleRefresh', 'entry')
    addDebugMessage('debug', 'Refresh button clicked - refreshing both database logs and debug messages');
    DebugLogger.logUIEvent('DebugPage: Refresh button clicked');
    
    try {
      await handleLogsRefresh();
      logHookCall('useDebugPage.handleRefresh', 'exit', { success: true })
    } catch (error) {
      logHookCall('useDebugPage.handleRefresh', 'exit', { success: false, error })
      throw error
    }
  }, [addDebugMessage, handleLogsRefresh]);

  const handleTestUIEvent = useCallback(() => {
    logHookCall('useDebugPage.handleTestUIEvent', 'entry')
    addDebugMessage('debug', 'Test UI Event button clicked', { userAction: 'manual_test' });
    DebugLogger.logUIEvent('DebugPage: Test button clicked', { 
      timestamp: new Date().toISOString(),
      userAction: 'manual_test' 
    });
    logHookCall('useDebugPage.handleTestUIEvent', 'exit')
  }, [addDebugMessage]);

  const handleMetadataDialog = useCallback((open: boolean, data?: unknown, title: string = '') => {
    logHookCall('useDebugPage.handleMetadataDialog', 'entry', { open, title })
    setMetadataDialog({
      open,
      data: data || null,
      title
    });
  }, [setMetadataDialog]);

  return {
    // Data state
    logs,
    loading,
    error,
    debugMessages,
    
    // Dialog state
    metadataDialog,
    
    // Event handlers
    handleRefresh,
    handleTestUIEvent,
    handleClearLogs,
    handleCopyLogsAsJSON,
    handleCopyDebugInfo,
    handleMetadataDialog,
    
    // Internal functions
    addDebugMessage,
  };
};