interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  source: 'frontend';
}

class FrontendLogger {
  private apiUrl: string;
  private queue: LogEntry[] = [];
  private isOnline = true;

  constructor() {
    this.apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/logs`;
    
    // Listen for online/offline events (only in browser environment)
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.flushQueue();
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  private async sendLog(entry: LogEntry): Promise<void> {
    if (!this.isOnline) {
      this.queue.push(entry);
      return;
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        throw new Error(`Failed to send log: ${response.status}`);
      }
    } catch (error) {
      // If sending fails, queue it
      this.queue.push(entry);
      console.error('Failed to send log to backend:', error);
    }
  }

  private async flushQueue(): Promise<void> {
    const entries = [...this.queue];
    this.queue = [];
    
    for (const entry of entries) {
      await this.sendLog(entry);
    }
  }

  private log(level: LogEntry['level'], message: string, metadata?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level,
      message,
      metadata,
      timestamp: new Date().toISOString(),
      source: 'frontend',
    };

    // Always log to console in development
    if (import.meta.env.DEV) {
      const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
      console[consoleMethod](`[${level.toUpperCase()}]`, message, metadata || '');
    }

    // Send to backend
    this.sendLog(entry);
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log('debug', message, metadata);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log('warn', message, metadata);
  }

  error(message: string, metadata?: Record<string, unknown>): void {
    this.log('error', message, metadata);
  }
}

export const logger = new FrontendLogger();