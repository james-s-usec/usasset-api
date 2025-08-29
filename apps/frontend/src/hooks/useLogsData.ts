import { useState, useCallback } from 'react';
import { LogsApiService, type LogEntry } from '../services/logs-api';

export interface UseLogsDataReturn {
  logs: LogEntry[];
  loading: boolean;
  error: string | null;
  loadLogs: (silent?: boolean) => Promise<void>;
  handleRefresh: () => Promise<void>;
  handleClearLogs: () => Promise<void>;
}

export const useLogsData = (): UseLogsDataReturn => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async (silent: boolean = false) => {
    try {
      // Don't create logs when loading logs - that's recursive!
      if (!silent) {
        console.log('Loading logs from database...');
      }
      setLoading(true);
      setError(null);
      
      // Fetch ALL logs (or at least 1000)
      const response = await LogsApiService.getLogs(1, 1000);
      
      if (!silent) {
        console.log(`Loaded ${response.logs.length} of ${response.pagination.total} total logs`);
      }
      
      setLogs(response.logs);
    } catch (error) {
      const errorMessage = `Failed to load logs: ${error instanceof Error ? error.message : String(error)}`;
      console.error('Failed to load logs:', error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    // Refresh the logs table (no logging to avoid creating new logs)
    await loadLogs(true);
  }, [loadLogs]);

  const handleClearLogs = useCallback(async () => {
    if (!window.confirm('Are you sure you want to clear all logs? This cannot be undone.')) {
      return;
    }
    
    try {
      // DON'T log anything before or during delete - it creates new logs!
      const result = await LogsApiService.deleteLogs();
      
      // Refresh the table to show empty state (silently, no logging)
      await loadLogs(true);
      
      alert(`${result.message}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Failed to clear logs:', error);
      alert(`Failed to clear logs: ${errorMessage}`);
    }
  }, [loadLogs]);

  return {
    logs,
    loading,
    error,
    loadLogs,
    handleRefresh,
    handleClearLogs,
  };
};