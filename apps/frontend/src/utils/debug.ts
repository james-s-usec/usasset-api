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
      import.meta.env.VITE_DEBUG_ENABLED === 'true';

    // Parse enabled categories from environment
    const categoriesEnv = import.meta.env.VITE_DEBUG_CATEGORIES || '';
    this.enabledCategories = new Set(
      categoriesEnv ? categoriesEnv.split(',').map((c: string) => c.trim() as DebugCategory) : []
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
   * API call logging - max 4 params per CLAUDE.md
   */
  logApiCall(method: string, url: string, data?: unknown, error?: unknown): void {
    if (error) {
      this.debugLog('api', `❌ ${method} ${url} failed`, { data, error });
    } else {
      this.debugLog('api', `✅ ${method} ${url}`, data);
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

  private getConsoleMethod(level: DebugLevel): 'error' | 'warn' | 'info' | 'log' {
    switch (level) {
      case 'error': return 'error';
      case 'warn': return 'warn';
      case 'info': return 'info';
      default: return 'log';
    }
  }

  private buildLogData(
    level: DebugLevel,
    message: string,
    category?: DebugCategory,
    data?: unknown
  ): {
    level: DebugLevel;
    message: string;
    data?: unknown;
    category?: DebugCategory;
    timestamp: string;
    url: string;
    userAgent: string;
  } {
    return {
      level,
      message: this.formatMessage(category, message),
      data,
      category,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };
  }

  private logToConsole(level: DebugLevel, message: string, data?: unknown): void {
    const method = this.getConsoleMethod(level);
    console[method](message, data ? data : '');
  }

  /**
   * Generic logging method - split for complexity < 7
   */
  private handleConsoleLog(skipConsole: boolean, level: DebugLevel, message: string, data?: unknown): void {
    if (!skipConsole) {
      this.logToConsole(level, message, data);
    }
  }

  private handleBackendLog(skipBackend: boolean, logData: {
    level: DebugLevel;
    message: string;
    data?: unknown;
    category?: DebugCategory;
    timestamp: string;
    url: string;
    userAgent: string;
  }): void {
    if (!skipBackend && this.isEnabled) {
      this.sendToBackend(logData).catch(error => {
        console.warn('Failed to send debug log to backend:', error);
      });
    }
  }

  private log(
    level: DebugLevel,
    message: string,
    options: DebugOptions = {},
    data?: unknown
  ): void {
    const { category, skipConsole = false, skipBackend = false } = options;
    
    if (!this.shouldLog(category)) return;

    const logData = this.buildLogData(level, message, category, data);
    this.handleConsoleLog(skipConsole, level, logData.message, data);
    this.handleBackendLog(skipBackend, logData);
  }

  private buildMetadata(logData: Record<string, unknown>): Record<string, unknown> {
    return {
      category: logData.category,
      url: logData.url,
      userAgent: logData.userAgent,
      source: 'debug-util'
    };
  }

  private buildInfoData(logData: Record<string, unknown>): Record<string, unknown> {
    return {
      level: logData.level,
      debugData: logData.data,
      ...this.buildMetadata(logData)
    };
  }

  /**
   * Send debug logs to backend - split for complexity
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
      const { DebugLogger } = await import('../services/debug-logger');
      
      if (logData.level === 'error') {
        const metadata = this.buildMetadata(logData);
        await DebugLogger.logError(logData.message, logData.data, metadata);
      } else {
        const infoData = this.buildInfoData(logData);
        await DebugLogger.logInfo(logData.message, infoData);
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