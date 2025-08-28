import { useEffect, useRef } from 'react';
import { DebugLogger } from '../services/debug-logger';

// Hook to track state changes and re-renders
export const useDebugTracker = (componentName: string, props?: Record<string, unknown>, state?: Record<string, unknown>) => {
  const renderCount = useRef(0);
  const prevProps = useRef(props);
  const prevState = useRef(state);
  const mountTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;

    // Log mount
    if (renderCount.current === 1) {
      DebugLogger.logInfo(`${componentName}: Component mounted`, {
        props,
        state,
        mountTime: new Date(mountTime.current).toISOString()
      });
      return;
    }

    // Track prop changes
    const propsChanged: Record<string, { old: unknown; new: unknown }> = {};
    if (props && prevProps.current) {
      Object.keys(props).forEach(key => {
        if (props[key] !== prevProps.current?.[key]) {
          propsChanged[key] = {
            old: prevProps.current?.[key],
            new: props[key]
          };
        }
      });
    }

    // Track state changes
    const stateChanged: Record<string, { old: unknown; new: unknown }> = {};
    if (state && prevState.current) {
      Object.keys(state).forEach(key => {
        if (state[key] !== prevState.current?.[key]) {
          stateChanged[key] = {
            old: prevState.current?.[key],
            new: state[key]
          };
        }
      });
    }

    // Log re-render with changes
    if (Object.keys(propsChanged).length > 0 || Object.keys(stateChanged).length > 0) {
      DebugLogger.logInfo(`${componentName}: Re-render triggered`, {
        renderCount: renderCount.current,
        propsChanged: Object.keys(propsChanged).length > 0 ? propsChanged : undefined,
        stateChanged: Object.keys(stateChanged).length > 0 ? stateChanged : undefined,
        timeSinceMount: Date.now() - mountTime.current + 'ms'
      });
    }

    prevProps.current = props;
    prevState.current = state;
  });

  // Log unmount
  useEffect(() => {
    const startTime = mountTime.current;
    return () => {
      DebugLogger.logInfo(`${componentName}: Component unmounted`, {
        totalRenders: renderCount.current,
        lifetimeMs: Date.now() - startTime
      });
    };
  }, [componentName]);

  return {
    renderCount: renderCount.current,
    logEvent: (event: string, data?: Record<string, unknown>) => {
      DebugLogger.logInfo(`${componentName}: ${event}`, {
        ...data,
        renderCount: renderCount.current
      });
    },
    logError: (error: string, errorData?: unknown) => {
      DebugLogger.logError(`${componentName}: ${error}`, errorData, {
        renderCount: renderCount.current
      });
    }
  };
};

// Hook to track async operations
export const useAsyncTracker = (componentName: string) => {
  const activePromises = useRef(new Set<string>());

  const trackAsync = async <T>(
    operation: string, 
    asyncFn: () => Promise<T>
  ): Promise<T> => {
    const operationId = `${operation}-${Date.now()}`;
    activePromises.current.add(operationId);
    
    DebugLogger.logInfo(`${componentName}: Async operation started`, {
      operation,
      operationId,
      activeCount: activePromises.current.size
    });

    try {
      const result = await asyncFn();
      activePromises.current.delete(operationId);
      
      DebugLogger.logInfo(`${componentName}: Async operation completed`, {
        operation,
        operationId,
        success: true,
        activeCount: activePromises.current.size
      });
      
      return result;
    } catch (error) {
      activePromises.current.delete(operationId);
      
      DebugLogger.logError(`${componentName}: Async operation failed`, error, {
        operation,
        operationId,
        activeCount: activePromises.current.size
      });
      
      throw error;
    }
  };

  return { trackAsync, activePromiseCount: activePromises.current.size };
};