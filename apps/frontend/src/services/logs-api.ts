import { apiService } from './api';

export interface LogEntry {
  id: string;
  correlation_id: string;
  level: string;
  message: string;
  metadata?: unknown;
  timestamp: string;
  created_at: string;
}

export interface LogsResponse {
  logs: LogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class LogsApiService {
  private static readonly BASE_PATH = '/logs';

  static async getLogs(page = 1, limit = 50): Promise<LogsResponse> {
    const response = await apiService.get<{ success: boolean; data: LogsResponse }>(
      `${LogsApiService.BASE_PATH}?page=${page}&limit=${limit}`
    );
    return response.data;
  }

  static async getLogsByLevel(level: string, page = 1, limit = 20): Promise<LogsResponse> {
    const response = await apiService.get<{ success: boolean; data: LogsResponse }>(
      `${LogsApiService.BASE_PATH}?level=${level}&page=${page}&limit=${limit}`
    );
    return response.data;
  }

  static async getLogsByCorrelationId(correlationId: string): Promise<{ logs: LogEntry[] }> {
    const response = await apiService.get<{ success: boolean; data: { logs: LogEntry[] } }>(
      `${LogsApiService.BASE_PATH}?correlationId=${correlationId}`
    );
    return response.data;
  }

  static async deleteLogs(): Promise<{ message: string; deletedCount: number }> {
    const response = await apiService.delete<{ success: boolean; data: { message: string; deletedCount: number } }>(
      LogsApiService.BASE_PATH
    );
    return response.data;
  }
}