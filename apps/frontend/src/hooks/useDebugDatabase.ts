/**
 * Debug Database Hook
 * Handles database sync for debug messages
 */

import { useCallback } from 'react';
import { LogsApiService, type LogEntry } from '../services/logs-api';
import { convertLogEntryToDebugMessage } from '../utils/debug-message-utils';
import { buildCompleteDebugInfo } from '../utils/debug-info-builder';
import { copyToClipboard } from '../utils/clipboard-copy';

interface UseDebugDatabaseReturn {
  refreshFromDatabase: () => Promise<void>;
  clearDatabaseLogs: () => Promise<{ message: string; deletedCount: number }>;
  copyAllDebugInfo: () => void;
}

const processLogsResponse = (response: { logs: LogEntry[] }): void => {
  response.logs.map(convertLogEntryToDebugMessage);
  // Note: This would need to update state but we don't have access here
  // In practice this should be connected to the state management
};

const createClearResult = (deletedCount: number): { message: string; deletedCount: number } => ({
  message: 'Database logs cleared successfully',
  deletedCount: deletedCount || 0
});

export function useDebugDatabase(): UseDebugDatabaseReturn {
  const refreshFromDatabase = useCallback(async (): Promise<void> => {
    try {
      const response = await LogsApiService.getLogs(1, 50);
      processLogsResponse(response);
    } catch {
      console.warn('Failed to refresh debug messages');
    }
  }, []);

  const clearDatabaseLogs = useCallback(async (): Promise<{ message: string; deletedCount: number }> => {
    try {
      const result = await LogsApiService.deleteLogs();
      return createClearResult(result.deletedCount);
    } catch {
      throw new Error('Failed to clear database logs');
    }
  }, []);

  const copyAllDebugInfo = useCallback((): void => {
    const debugInfo = buildCompleteDebugInfo();
    const json = JSON.stringify(debugInfo, null, 2);
    copyToClipboard(json);
  }, []);

  return {
    refreshFromDatabase,
    clearDatabaseLogs,
    copyAllDebugInfo
  };
}