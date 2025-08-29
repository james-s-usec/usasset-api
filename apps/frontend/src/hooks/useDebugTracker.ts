import { useEffect, useRef } from 'react';
import { DebugLogger } from '../services/debug-logger';
import { 
  trackChanges, 
  logMountEvent, 
  logRenderChanges, 
  logUnmountEvent
} from '../utils/debug-tracker-helpers';

const createEventLogger = (
  componentName: string, 
  renderCount: React.MutableRefObject<number>
): {
  logEvent: (event: string, data?: Record<string, unknown>) => void;
  logError: (error: string, errorData?: unknown) => void;
} => ({
  logEvent: (event: string, data?: Record<string, unknown>): void => {
    DebugLogger.logInfo(`${componentName}: ${event}`, {
      ...data,
      renderCount: renderCount.current
    });
  },
  logError: (error: string, errorData?: unknown): void => {
    DebugLogger.logError(`${componentName}: ${error}`, errorData, {
      renderCount: renderCount.current
    });
  }
});

const useRenderTracking = (params: {
  componentName: string;
  props: Record<string, unknown> | undefined;
  state: Record<string, unknown> | undefined;
  renderCount: React.MutableRefObject<number>;
  prevProps: React.MutableRefObject<Record<string, unknown> | undefined>;
  prevState: React.MutableRefObject<Record<string, unknown> | undefined>;
  mountTime: React.MutableRefObject<number>;
}): void => {
  const { componentName, props, state, renderCount, prevProps, prevState, mountTime } = params;
  useEffect(() => {
    renderCount.current += 1;

    if (renderCount.current === 1) {
      logMountEvent(componentName, props, state, mountTime.current);
      return;
    }

    const propsChanged = trackChanges(props, prevProps.current);
    const stateChanged = trackChanges(state, prevState.current);
    
    logRenderChanges({
      name: componentName,
      renderCount: renderCount.current,
      propsChanged,
      stateChanged,
      mountTime: mountTime.current
    });

    prevProps.current = props;
    prevState.current = state;
  });
};

const useUnmountTracking = (
  componentName: string,
  renderCount: React.MutableRefObject<number>,
  mountTime: React.MutableRefObject<number>
): void => {
  useEffect(() => {
    const startTime = mountTime.current;
    const currentRenderCount = renderCount.current;
    return (): void => {
      logUnmountEvent(componentName, currentRenderCount, startTime);
    };
  }, [componentName, renderCount, mountTime]);
};

export const useDebugTracker = (
  componentName: string, 
  props?: Record<string, unknown>, 
  state?: Record<string, unknown>
): {
  renderCount: number;
  logEvent: (event: string, data?: Record<string, unknown>) => void;
  logError: (error: string, errorData?: unknown) => void;
} => {
  const renderCount = useRef(0);
  const prevProps = useRef(props);
  const prevState = useRef(state);
  const mountTime = useRef(Date.now());

  useRenderTracking({
    componentName, 
    props, 
    state, 
    renderCount, 
    prevProps, 
    prevState, 
    mountTime
  });
  useUnmountTracking(componentName, renderCount, mountTime);

  const logger = createEventLogger(componentName, renderCount);
  
  return {
    renderCount: renderCount.current,
    logEvent: logger.logEvent,
    logError: logger.logError
  };
};

const createAsyncLoggers = (componentName: string): {
  logAsyncStart: (op: string, id: string, count: number) => void;
  logAsyncEnd: (op: string, id: string, count: number, success: boolean) => void;
} => ({
  logAsyncStart: (op: string, id: string, count: number): void => {
    DebugLogger.logInfo(`${componentName}: Async operation started`, {
      operation: op,
      operationId: id,
      activeCount: count
    });
  },
  logAsyncEnd: (op: string, id: string, count: number, success: boolean): void => {
    const msg = success ? 'completed' : 'failed';
    DebugLogger.logInfo(`${componentName}: Async operation ${msg}`, {
      operation: op,
      operationId: id,
      success,
      activeCount: count
    });
  }
});

const createAsyncHandlers = (
  componentName: string,
  activePromises: React.MutableRefObject<Set<string>>,
  logAsyncEnd: (op: string, id: string, count: number, success: boolean) => void
): {
  handleAsyncSuccess: <T>(operation: string, operationId: string, result: T) => T;
  handleAsyncError: (operation: string, operationId: string, error: unknown) => never;
} => ({
  handleAsyncSuccess: <T>(operation: string, operationId: string, result: T): T => {
    activePromises.current.delete(operationId);
    logAsyncEnd(operation, operationId, activePromises.current.size, true);
    return result;
  },
  handleAsyncError: (operation: string, operationId: string, error: unknown): never => {
    activePromises.current.delete(operationId);
    
    DebugLogger.logError(`${componentName}: Async operation failed`, error, {
      operation,
      operationId,
      activeCount: activePromises.current.size
    });
    
    throw error;
  }
});

// Hook to track async operations
export const useAsyncTracker = (componentName: string): {
  trackAsync: <T>(operation: string, asyncFn: () => Promise<T>) => Promise<T>;
  activePromiseCount: number;
} => {
  const activePromises = useRef(new Set<string>());
  const { logAsyncStart, logAsyncEnd } = createAsyncLoggers(componentName);
  const { handleAsyncSuccess, handleAsyncError } = createAsyncHandlers(componentName, activePromises, logAsyncEnd);

  const trackAsync = async <T>(
    operation: string, 
    asyncFn: () => Promise<T>
  ): Promise<T> => {
    const operationId = `${operation}-${Date.now()}`;
    activePromises.current.add(operationId);
    
    logAsyncStart(operation, operationId, activePromises.current.size);

    try {
      const result = await asyncFn();
      return handleAsyncSuccess(operation, operationId, result);
    } catch (error) {
      return handleAsyncError(operation, operationId, error);
    }
  };

  return { trackAsync, activePromiseCount: activePromises.current.size };
};