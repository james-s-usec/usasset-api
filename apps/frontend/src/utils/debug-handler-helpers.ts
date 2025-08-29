/**
 * Debug Handler Helper Functions
 * Extracted from DebugPage component for CLAUDE.md compliance
 */

interface DebugLoggers {
  logEvent: (type: string, data?: unknown) => void;
  logCustom: (msg: string, data?: unknown) => void;
  startTiming: (name: string) => string | undefined;
  endTiming: (mark?: string, name?: string) => void;
}

export const createDebugHandler = <T extends unknown[], R>(
  handler: (...args: T) => R,
  eventName: string,
  debug: Pick<DebugLoggers, 'logEvent' | 'logCustom'>,
  successMsg?: string
): ((...args: T) => R) => {
  return (...args: T): R => {
    debug.logEvent(eventName, { args: args.length });
    const result = handler(...args);
    if (successMsg) {
      debug.logCustom(successMsg);
    }
    return result;
  };
};

export const createAsyncDebugHandler = <T extends unknown[]>(
  asyncHandler: (...args: T) => Promise<void>,
  eventName: string,
  debug: DebugLoggers,
  successMsg?: string
): ((...args: T) => Promise<void>) => {
  return async (...args: T): Promise<void> => {
    const mark = debug.startTiming(eventName);
    debug.logEvent(eventName + '-start', { args: args.length });
    
    try {
      await asyncHandler(...args);
      debug.logCustom(successMsg || `${eventName} completed successfully`);
      debug.endTiming(mark, eventName + '-success');
    } catch (error) {
      debug.logCustom(`${eventName} failed`, { error });
      debug.endTiming(mark, eventName + '-error');
      throw error;
    }
  };
};