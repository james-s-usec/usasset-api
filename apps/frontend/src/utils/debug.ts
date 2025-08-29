/**
 * Frontend Debug Utilities
 * 
 * Implements CLAUDE.md rule #8: "add comprehensive logging FIRST"
 * - Log entry points with input parameters
 * - Log intermediate results
 * - Make debug logs conditional (DEBUG env var)
 * - Keep debug code but disable by default
 */

export type DebugLevel = 'debug' | 'info' | 'warn' | 'error';
export type DebugCategory = 
  | 'component' 
  | 'hook' 
  | 'api' 
  | 'state' 
  | 'event' 
  | 'performance' 
  | 'navigation'
  | 'render'
  | 'lifecycle';

interface DebugOptions {
  category?: DebugCategory;
  data?: Record<string, unknown>;
  performance?: boolean;
  skipConsole?: boolean;
  skipBackend?: boolean;
}

class DebugUtil {
  private isEnabled: boolean;
  private enabledCategories: Set<DebugCategory>;
  private performanceMarks: Map<string, number> = new Map();

  constructor() {
    // Check both VITE_DEBUG and VITE_DEBUG_ENABLED for flexibility
    this.isEnabled = 
      import.meta.env.VITE_DEBUG === 'true' || 
      import.meta.env.VITE_DEBUG_ENABLED === 'true' ||
      import.meta.env.MODE === 'development';

    // Parse enabled categories from environment
    const categoriesEnv = import.meta.env.VITE_DEBUG_CATEGORIES || '';
    this.enabledCategories = new Set(
      categoriesEnv ? categoriesEnv.split(',').map(c => c.trim() as DebugCategory) : []
    );

    // If no specific categories set, enable all in development
    if (this.enabledCategories.size === 0 && this.isEnabled) {
      this.enabledCategories = new Set(['component', 'hook', 'api', 'state', 'event', 'performance', 'navigation', 'render', 'lifecycle']);
    }
  }

  private shouldLog(category?: DebugCategory): boolean {
    if (!this.isEnabled) return false;
    if (!category) return true;
    return this.enabledCategories.has(category);
  }

  private formatMessage(category: DebugCategory | undefined, message: string): string {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const categoryPrefix = category ? `[${category.toUpperCase()}]` : '';
    return `🔍 ${timestamp} ${categoryPrefix} ${message}`;
  }

  /**
   * Main debug logging function - follows CLAUDE.md pattern
   * debugLog('category', '🔍 Called with:', params)
   */
  debugLog(category: DebugCategory, message: string, data?: unknown, options: Omit<DebugOptions, 'category'> = {}): void {
    if (!this.shouldLog(category)) return;

    const fullOptions: DebugOptions = { ...options, category };
    this.log('debug', message, fullOptions, data);
  }

  /**
   * Component entry point logging
   */
  logComponentEntry(componentName: string, props?: Record<string, unknown>): void {
    this.debugLog('component', `🏁 ${componentName} rendered`, props);
  }

  /**
   * Component state change logging  
   */
  logStateChange(componentName: string, stateName: string, oldValue: unknown, newValue: unknown): void {
    this.debugLog('state', `🔄 ${componentName}.${stateName} changed`, {
      from: oldValue,
      to: newValue,
      component: componentName
    });
  }

  /**
   * Hook lifecycle logging
   */
  logHookCall(hookName: string, phase: 'entry' | 'exit' | 'effect' | 'cleanup', data?: unknown): void {
    const emoji = {
      entry: '🪝',
      exit: '🎯', 
      effect: '⚡',
      cleanup: '🧹'
    }[phase];

    this.debugLog('hook', `${emoji} ${hookName} ${phase}`, data);
  }

  /**
   * API call logging
   */
  logApiCall(method: string, url: string, params?: unknown, response?: unknown, error?: unknown): void {
    if (error) {
      this.debugLog('api', `❌ ${method} ${url} failed`, { params, error });
    } else {
      this.debugLog('api', `✅ ${method} ${url}`, { params, response });
    }
  }

  /**
   * Event handler logging
   */
  logEvent(eventType: string, target: string, data?: unknown): void {
    this.debugLog('event', `👆 ${eventType} on ${target}`, data);
  }

  /**
   * Performance timing utilities
   */
  startPerformanceMark(markName: string): void {
    if (!this.shouldLog('performance')) return;
    
    this.performanceMarks.set(markName, performance.now());
    this.debugLog('performance', `⏱️ Started timing: ${markName}`);
  }

  endPerformanceMark(markName: string, context?: string): number | null {
    if (!this.shouldLog('performance')) return null;

    const startTime = this.performanceMarks.get(markName);
    if (!startTime) {
      this.debugLog('performance', `⚠️ No start time found for mark: ${markName}`);
      return null;
    }

    const duration = performance.now() - startTime;
    this.performanceMarks.delete(markName);
    
    this.debugLog('performance', `⏱️ ${markName} took ${duration.toFixed(2)}ms`, {
      duration,
      context,
      markName
    });

    return duration;
  }

  /**
   * Navigation logging
   */
  logNavigation(from: string, to: string, data?: unknown): void {
    this.debugLog('navigation', `🧭 Navigate from ${from} to ${to}`, data);
  }

  /**
   * Render cycle logging
   */
  logRender(componentName: string, reason?: string, data?: unknown): void {
    this.debugLog('render', `🎨 ${componentName} render${reason ? ` (${reason})` : ''}`, data);
  }

  /**
   * Generic logging method
   */
  private log(level: DebugLevel, message: string, options: DebugOptions = {}, data?: unknown): void {
    const { category, skipConsole = false, skipBackend = false } = options;
    
    if (!this.shouldLog(category)) return;

    const formattedMessage = this.formatMessage(category, message);
    const logData = {
      level,
      message: formattedMessage,
      data,
      category,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // Console logging (unless skipped)
    if (!skipConsole) {
      const consoleMethod = level === 'error' ? 'error' : 
                           level === 'warn' ? 'warn' : 
                           level === 'info' ? 'info' : 'log';
      
      console[consoleMethod](formattedMessage, data ? data : '');
    }

    // Backend logging (unless skipped) - async but don't await
    if (!skipBackend && this.isEnabled) {
      this.sendToBackend(logData).catch(error => {
        console.warn('Failed to send debug log to backend:', error);
      });
    }
  }

  /**
   * Send debug logs to backend (fire and forget)
   */
  private async sendToBackend(logData: {
    level: DebugLevel;
    message: string;
    data?: unknown;
    category?: DebugCategory;
    timestamp: string;
    url: string;
    userAgent: string;
  }): Promise<void> {
    try {
      // Import DebugLogger dynamically to avoid circular dependencies
      const { DebugLogger } = await import('../services/debug-logger');
      
      if (logData.level === 'error') {
        await DebugLogger.logError(logData.message, logData.data, {
          category: logData.category,
          url: logData.url,
          userAgent: logData.userAgent,
          source: 'debug-util'
        });
      } else {
        await DebugLogger.logInfo(logData.message, {
          level: logData.level,
          debugData: logData.data,
          category: logData.category,
          url: logData.url,
          userAgent: logData.userAgent,
          source: 'debug-util'
        });
      }
    } catch {
      // Silent fail to avoid infinite loops
    }
  }

  /**
   * Check if debug is enabled
   */
  get enabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Get enabled categories
   */
  get categories(): DebugCategory[] {
    return Array.from(this.enabledCategories);
  }

  /**
   * Enable/disable debug at runtime
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Add category at runtime
   */
  enableCategory(category: DebugCategory): void {
    this.enabledCategories.add(category);
  }

  /**
   * Remove category at runtime
   */
  disableCategory(category: DebugCategory): void {
    this.enabledCategories.delete(category);
  }
}

// Export singleton instance
export const debug = new DebugUtil();

// Export convenience functions following CLAUDE.md pattern
export const debugLog = debug.debugLog.bind(debug);
export const logComponentEntry = debug.logComponentEntry.bind(debug);
export const logStateChange = debug.logStateChange.bind(debug);
export const logHookCall = debug.logHookCall.bind(debug);
export const logApiCall = debug.logApiCall.bind(debug);
export const logEvent = debug.logEvent.bind(debug);
export const startPerformanceMark = debug.startPerformanceMark.bind(debug);
export const endPerformanceMark = debug.endPerformanceMark.bind(debug);
export const logNavigation = debug.logNavigation.bind(debug);
export const logRender = debug.logRender.bind(debug);