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

const useMetadataDialogState = (): [{ open: boolean; data: unknown; title: string }, (value: { open: boolean; data: unknown; title: string }) => void] => {
  return useDebugState<{ open: boolean; data: unknown; title: string }>({
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
};

const useRefreshHandler = (
  addDebugMessage: (level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: unknown) => void,
  handleLogsRefresh: () => Promise<void>
): (() => Promise<void>) => {
  return useCallback(async (): Promise<void> => {
    logHookCall('useDebugPage.handleRefresh', 'entry')
    addDebugMessage('debug', 'Refresh clicked');
    DebugLogger.logUIEvent('DebugPage: Refresh');
    
    try {
      await handleLogsRefresh();
      logHookCall('useDebugPage.handleRefresh', 'exit', { success: true })
    } catch (error) {
      logHookCall('useDebugPage.handleRefresh', 'exit', { success: false, error })
      throw error
    }
  }, [addDebugMessage, handleLogsRefresh]);
};

const useTestUIHandler = (
  addDebugMessage: (level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: unknown) => void
): (() => void) => {
  return useCallback((): void => {
    logHookCall('useDebugPage.handleTestUIEvent', 'entry')
    const data = { 
      timestamp: new Date().toISOString(),
      userAction: 'manual_test' 
    };
    addDebugMessage('debug', 'Test UI Event', data);
    DebugLogger.logUIEvent('DebugPage: Test', data);
    logHookCall('useDebugPage.handleTestUIEvent', 'exit')
  }, [addDebugMessage]);
};

const useDebugPageInitialization = (): {
  metadataDialog: { open: boolean; data: unknown; title: string };
  setMetadataDialog: (value: { open: boolean; data: unknown; title: string }) => void;
  debugMessages: DebugMessage[];
  addDebugMessage: (level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: unknown) => void;
} => {
  const [metadataDialog, setMetadataDialog] = useMetadataDialogState();
  const { addMessage: addDebugMessage, messages: debugMessages } = useDebug();
  
  useGlobalErrorHandlers({ addDebugMessage });
  
  return {
    metadataDialog,
    setMetadataDialog,
    debugMessages,
    addDebugMessage
  };
};

const setupMountEffect = (
  logsData: ReturnType<typeof useLogsData>
): void => {
  useDebugMountEffect((): (() => void) => {
    logHookCall('useDebugPage.mountEffect', 'entry')
    DebugLogger.logUIEvent('DebugPage mounted');
    logsData.loadLogs();
    
    return (): void => {
      logHookCall('useDebugPage.mountEffect', 'cleanup')
    };
  }, {
    name: 'mountEffect',
    componentName: 'useDebugPage'
  });
};

export const useDebugPage = (): UseDebugPageReturn => {
  logHookCall('useDebugPage', 'entry');

  const init = useDebugPageInitialization();
  const logsData = useLogsData();
  
  const clipboardActions = useClipboardActions({
    logs: logsData.logs,
    debugMessages: init.debugMessages,
    addDebugMessage: init.addDebugMessage,
  });
  
  setupMountEffect(logsData);

  const handleRefresh = useRefreshHandler(init.addDebugMessage, logsData.handleRefresh);
  const handleTestUIEvent = useTestUIHandler(init.addDebugMessage);

  const handleMetadataDialog = useCallback((
    open: boolean, 
    data?: unknown, 
    title: string = ''
  ): void => {
    logHookCall('useDebugPage.handleMetadataDialog', 'entry', { open, title });
    init.setMetadataDialog({ open, data: data || null, title });
  }, [init.setMetadataDialog]);

  return {
    logs: logsData.logs,
    loading: logsData.loading,
    error: logsData.error,
    debugMessages: init.debugMessages,
    metadataDialog: init.metadataDialog,
    handleRefresh,
    handleTestUIEvent,
    handleClearLogs: logsData.handleClearLogs,
    handleCopyLogsAsJSON: clipboardActions.handleCopyLogsAsJSON,
    handleCopyDebugInfo: clipboardActions.handleCopyDebugInfo,
    handleMetadataDialog,
    addDebugMessage: init.addDebugMessage,
  };
};