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

const confirmClearLogs = (): boolean => {
  const msg = 'Are you sure you want to clear all logs? This cannot be undone.';
  return window.confirm(msg);
};

const showClearResult = (success: boolean, message: string): void => {
  if (success) {
    alert(message);
  } else {
    alert(`Failed to clear logs: ${message}`);
  }
};

const logLoadingActivity = (silent: boolean, action: 'start' | 'success', count?: number, total?: number): void => {
  if (silent) return;
  
  if (action === 'start') {
    console.log('Loading logs from database...');
  } else {
    console.log(`Loaded ${count} of ${total} total logs`);
  }
};

const handleLoadError = (error: unknown): string => {
  const errorMessage = `Failed to load logs: ${error instanceof Error ? error.message : String(error)}`;
  console.error('Failed to load logs:', error);
  return errorMessage;
};

const handleClearError = (error: unknown): string => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error('Failed to clear logs:', error);
  return errorMessage;
};

const useLoadLogs = (): {
  logs: LogEntry[];
  loading: boolean;
  error: string | null;
  loadLogs: (silent?: boolean) => Promise<void>;
} => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async (silent: boolean = false): Promise<void> => {
    try {
      logLoadingActivity(silent, 'start');
      setLoading(true);
      setError(null);
      
      const response = await LogsApiService.getLogs(1, 1000);
      logLoadingActivity(silent, 'success', response.logs.length, response.pagination.total);
      setLogs(response.logs);
    } catch (error) {
      setError(handleLoadError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  return { logs, loading, error, loadLogs };
};

export const useLogsData = (): UseLogsDataReturn => {
  const { logs, loading, error, loadLogs } = useLoadLogs();

  const handleRefresh = useCallback(async (): Promise<void> => {
    await loadLogs(true);
  }, [loadLogs]);

  const handleClearLogs = useCallback(async (): Promise<void> => {
    if (!confirmClearLogs()) return;
    
    try {
      const result = await LogsApiService.deleteLogs();
      await loadLogs(true);
      showClearResult(true, result.message);
    } catch (error) {
      showClearResult(false, handleClearError(error));
    }
  }, [loadLogs]);

  return { logs, loading, error, loadLogs, handleRefresh, handleClearLogs };
};