/**
 * Debug Database Hook
 * Handles database sync for debug messages
 */

import { useCallback } from 'react';
import { LogsApiService } from '../services/logs-api';
import { convertLogEntryToDebugMessage } from '../utils/debug-message-utils';
import type { DebugMessage } from '../components/DebugConsole';

export function useDebugDatabase() {
  const refreshFromDatabase = useCallback(async (): Promise<DebugMessage[]> => {
    try {
      const response = await LogsApiService.getLogs(1, 50);
      return response.logs.map(convertLogEntryToDebugMessage);
    } catch (error) {
      console.warn('Failed to refresh debug messages:', error);
      return [];
    }
  }, []);

  const clearDatabaseLogs = useCallback(async () => {
    try {
      const result = await LogsApiService.deleteLogs();
      return { message: 'Database logs cleared successfully', deletedCount: result.deletedCount || 0 };
    } catch (error) {
      throw new Error('Failed to clear database logs');
    }
  }, []);

  const copyAllDebugInfo = useCallback(() => {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      localStorage: { ...localStorage },
      sessionStorage: { ...sessionStorage }
    };
    navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
  }, []);

  return {
    refreshFromDatabase,
    clearDatabaseLogs,
    copyAllDebugInfo
  };
}