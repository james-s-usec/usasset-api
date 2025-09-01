import axios from "axios";
import {
  DEFAULT_API_BASE_URL,
  HTTP_TIMEOUT_MS,
  DEFAULT_LOGS_LIMIT,
} from "./constants.js";

export interface LogMetadata {
  url?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  operation?: string;
  stack?: string;
  userAgent?: string;
  ip?: string;
  requestHeaders?: string;
  requestBody?: string;
  responseData?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  id: string;
  correlation_id: string;
  level: string;
  message: string;
  metadata: LogMetadata;
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

export class LogsApiClient {
  private baseUrl: string;

  public constructor(baseUrl?: string) {
    // Remove /api from base URL since logs endpoint is at /logs not /api/logs
    const cleanBaseUrl = baseUrl || DEFAULT_API_BASE_URL;
    this.baseUrl = cleanBaseUrl.replace("/api", "");
  }

  public async getLogs(
    page = 1,
    limit = DEFAULT_LOGS_LIMIT,
    level?: string,
  ): Promise<LogsResponse> {
    const params: Record<string, string> = {
      page: String(page),
      limit: String(limit),
    };

    if (level) {
      params.level = level;
    }

    const response = await axios.get(`${this.baseUrl}/logs`, {
      params,
      timeout: HTTP_TIMEOUT_MS,
    });

    // Handle wrapped response format
    const backendResponse = response.data as {
      success: boolean;
      data: LogsResponse;
    };

    return backendResponse.data;
  }

  public async getLogsByCorrelationId(
    correlationId: string,
  ): Promise<LogEntry[]> {
    const response = await axios.get(`${this.baseUrl}/logs`, {
      params: { correlationId },
      timeout: HTTP_TIMEOUT_MS,
    });

    // Handle wrapped response format - correlation ID queries return different format
    const backendResponse = response.data as {
      success: boolean;
      data: { logs: LogEntry[] };
    };

    return backendResponse.data.logs;
  }

  public async deleteLogs(): Promise<{ deletedCount: number }> {
    const response = await axios.delete(`${this.baseUrl}/logs`, {
      timeout: HTTP_TIMEOUT_MS,
    });

    // Handle wrapped response format
    const backendResponse = response.data as {
      success: boolean;
      data: { deletedCount: number };
    };

    return backendResponse.data;
  }
}
