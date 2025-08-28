export interface LogEntryData {
  id: string;
  correlation_id: string;
  operation_type: string;
  endpoint: string;
  http_method: string;
  status_code: number;
  request_data?: unknown;
  response_data?: unknown;
  error_message?: string;
  duration_ms?: number;
  created_at: string;
}

export interface LogsListResponse {
  logs: LogEntryData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
