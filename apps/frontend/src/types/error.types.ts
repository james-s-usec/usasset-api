export interface ApiError {
  message: string;
  statusCode?: number;
  error?: string;
  timestamp?: string;
  path?: string;
}