import { apiService } from './api';

export class DebugLogger {
  static async logUIEvent(event: string, details?: Record<string, unknown>): Promise<void> {
    try {
      await apiService.post('/logs', {
        level: 'debug',
        message: `UI Event: ${event}`,
        metadata: {
          ...details,
          source: 'frontend-debug',
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
        source: 'frontend',
      });
    } catch (error) {
      console.error('Failed to log UI event:', error);
    }
  }

  static async logError(message: string, error: unknown, context?: Record<string, unknown>): Promise<void> {
    try {
      await apiService.post('/logs', {
        level: 'error',
        message: `Debug Error: ${message}`,
        metadata: {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          ...context,
          source: 'frontend-debug',
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
        source: 'frontend',
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  static async logInfo(message: string, details?: Record<string, unknown>): Promise<void> {
    try {
      await apiService.post('/logs', {
        level: 'info',
        message: `Debug Info: ${message}`,
        metadata: {
          ...details,
          source: 'frontend-debug',
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
        source: 'frontend',
      });
    } catch (error) {
      console.error('Failed to log info:', error);
    }
  }
}