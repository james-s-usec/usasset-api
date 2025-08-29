import { useEffect, useRef } from 'react';
import { DebugLogger } from '../services/debug-logger';

// Hook to track state changes and re-renders
type ChangeRecord = Record<string, { old: unknown; new: unknown }>;

const trackChanges = <T extends Record<string, unknown>>(
  current: T | undefined,
  previous: T | undefined
): ChangeRecord => {
  const changes: Record<string, { old: unknown; new: unknown }> = {};
  if (!current || !previous) return changes;
  
  Object.keys(current).forEach(key => {
    if (current[key] !== previous[key]) {
      changes[key] = { old: previous[key], new: current[key] };
    }
  });
  
  return changes;
};

const logMountEvent = (name: string, props?: Record<string, unknown>, state?: Record<string, unknown>, time?: number): void => {
  DebugLogger.logInfo(`${name}: Component mounted`, {
    props,
    state,
    mountTime: time ? new Date(time).toISOString() : new Date().toISOString()
  });
};

interface LogRenderChangesParams {
  name: string;
  renderCount: number;
  propsChanged: ChangeRecord;
  stateChanged: ChangeRecord;
  mountTime: number;
}

const logRenderChanges = (params: LogRenderChangesParams): void => {
  const { name, renderCount, propsChanged, stateChanged, mountTime } = params;
  const hasChanges = Object.keys(propsChanged).length > 0 || Object.keys(stateChanged).length > 0;
  if (!hasChanges) return;
  
  DebugLogger.logInfo(`${name}: Re-render triggered`, {
    renderCount,
    propsChanged: Object.keys(propsChanged).length > 0 ? propsChanged : undefined,
    stateChanged: Object.keys(stateChanged).length > 0 ? stateChanged : undefined,
    timeSinceMount: Date.now() - mountTime + 'ms'
  });
};

const setupRenderTracking = (
  componentName: string,
  props: Record<string, unknown> | undefined,
  state: Record<string, unknown> | undefined,
  renderCount: React.MutableRefObject<number>,
  prevProps: React.MutableRefObject<Record<string, unknown> | undefined>,
  prevState: React.MutableRefObject<Record<string, unknown> | undefined>,
  mountTime: React.MutableRefObject<number>
): void => {
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

const setupUnmountTracking = (
  componentName: string,
  renderCount: React.MutableRefObject<number>,
  mountTime: React.MutableRefObject<number>
): void => {
  useEffect(() => {
    const startTime = mountTime.current;
    return (): void => {
      DebugLogger.logInfo(`${componentName}: Component unmounted`, {
        totalRenders: renderCount.current,
        lifetimeMs: Date.now() - startTime
      });
    };
  }, [componentName]);
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

  setupRenderTracking(componentName, props, state, renderCount, prevProps, prevState, mountTime);
  setupUnmountTracking(componentName, renderCount, mountTime);

  return {
    renderCount: renderCount.current,
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
  };
};

// Hook to track async operations
export const useAsyncTracker = (componentName: string): {
  trackAsync: <T>(operation: string, asyncFn: () => Promise<T>) => Promise<T>;
  activePromiseCount: number;
} => {
  const activePromises = useRef(new Set<string>());

  const logAsyncStart = (op: string, id: string, count: number): void => {
    DebugLogger.logInfo(`${componentName}: Async operation started`, {
      operation: op,
      operationId: id,
      activeCount: count
    });
  };

  const logAsyncEnd = (op: string, id: string, count: number, success: boolean): void => {
    const msg = success ? 'completed' : 'failed';
    DebugLogger.logInfo(`${componentName}: Async operation ${msg}`, {
      operation: op,
      operationId: id,
      success,
      activeCount: count
    });
  };

  const handleAsyncSuccess = <T>(
    operation: string,
    operationId: string,
    result: T
  ): T => {
    activePromises.current.delete(operationId);
    logAsyncEnd(operation, operationId, activePromises.current.size, true);
    return result;
  };

  const handleAsyncError = (
    operation: string,
    operationId: string,
    error: unknown
  ): never => {
    activePromises.current.delete(operationId);
    
    DebugLogger.logError(`${componentName}: Async operation failed`, error, {
      operation,
      operationId,
      activeCount: activePromises.current.size
    });
    
    throw error;
  };

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