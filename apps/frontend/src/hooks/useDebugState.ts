/**
 * State Debug Hook
 * 
 * Enhanced useState with automatic debug logging
 * Follows CLAUDE.md principle: "Log intermediate results"
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDebugStateLogger } from './useDebugStateLogger';
import { debug } from '../utils/debug';
import { config } from '../config';

interface UseDebugStateOptions<T> {
  name: string;
  componentName?: string;
  logAllChanges?: boolean;
  logOnlyChanged?: boolean;
  compareFunction?: (prev: T, next: T) => boolean;
}

// Helper function for creating debug state setter
function createDebugStateSetter<T>(
  setValueInternal: React.Dispatch<React.SetStateAction<T>>,
  refs: {
    prevValue: React.MutableRefObject<T>;
    logOnlyChanged: React.MutableRefObject<boolean>;
    compareFunction: React.MutableRefObject<((prev: T, next: T) => boolean) | undefined>;
    logStats: React.MutableRefObject<(hasChanged: boolean, prev: unknown, next: unknown, isFunc: boolean) => void>;
  }
) {
  return (newValue: T | ((prev: T) => T)): void => {
    setValueInternal((prev: T) => {
      const isFunc = typeof newValue === 'function';
      const next = isFunc ? (newValue as (prev: T) => T)(prev) : newValue;
      
      const hasChanged = refs.compareFunction.current ? 
        !refs.compareFunction.current(prev, next) :
        prev !== next;

      if (!hasChanged && refs.logOnlyChanged.current) return prev;
      
      if (hasChanged || !refs.logOnlyChanged.current) {
        refs.logStats.current(hasChanged, prev, next, isFunc);
      }
      refs.prevValue.current = next;
      return next;
    });
  };
}

export function useDebugState<T>(
  initialValue: T,
  options: UseDebugStateOptions<T>
): [T, (newValue: T | ((prev: T) => T)) => void] {
  const { name, componentName = 'Unknown', logAllChanges = false, logOnlyChanged = true, compareFunction } = options;
  
  const shouldDebug = config.debug.enabled && config.debug.consoleEnabled;
  const [value, setValueInternal] = useState<T>(initialValue);
  
  const prevValueRef = useRef<T>(initialValue);
  const logOnlyChangedRef = useRef(logOnlyChanged);
  const compareFunctionRef = useRef(compareFunction);
  const { logStats } = useDebugStateLogger({
    componentName, name, initialValue, logAllChanges, disabled: !shouldDebug
  });
  const logStatsRef = useRef(logStats);
  
  useEffect(() => {
    logOnlyChangedRef.current = logOnlyChanged;
    compareFunctionRef.current = compareFunction;
    logStatsRef.current = logStats;
  }, [logOnlyChanged, compareFunction, logStats]);

  const setValue = useCallback(() => createDebugStateSetter(setValueInternal, {
    prevValue: prevValueRef,
    logOnlyChanged: logOnlyChangedRef,
    compareFunction: compareFunctionRef,
    logStats: logStatsRef
  }), [setValueInternal]);

  if (!shouldDebug) {
    return [value, setValueInternal];
  }

  return [value, setValue];
}

/**
 * Debug state for objects with deep comparison
 */
export function useDebugObjectState<T extends Record<string, unknown>>(
  initialValue: T,
  options: Omit<UseDebugStateOptions<T>, 'compareFunction'>
): [T, (value: T | ((prev: T) => T)) => void] {
  return useDebugState(initialValue, {
    ...options,
    compareFunction: (prev, next): boolean => JSON.stringify(prev) === JSON.stringify(next)
  });
}

/**
 * Debug state for arrays with deep comparison
 */
export function useDebugArrayState<T>(
  initialValue: T[],
  options: Omit<UseDebugStateOptions<T[]>, 'compareFunction'>
): [T[], (value: T[] | ((prev: T[]) => T[])) => void] {
  return useDebugState(initialValue, {
    ...options,
    compareFunction: (prev, next): boolean => {
      if (prev.length !== next.length) return false;
      return JSON.stringify(prev) === JSON.stringify(next);
    }
  });
}

/**
 * Debug state with validation
 */
export function useDebugValidatedState<T>(
  initialValue: T,
  options: UseDebugStateOptions<T> & {
    validator?: (value: T) => string | null;
  }
): [T, (value: T | ((prev: T) => T)) => void, string | null] {
  const { validator, ...debugOptions } = options;
  const [value, setValue] = useDebugState(initialValue, debugOptions);

  const setValueWithValidation = useCallback((newValue: T | ((prev: T) => T)) => {
    const nextValue = typeof newValue === 'function' ? (newValue as (prev: T) => T)(value) : newValue;
    
    if (validator) {
      const error = validator(nextValue);
      if (error) {
        debug.debugLog('state', `❌ ${debugOptions.componentName}.${debugOptions.name} validation failed`, {
          error,
          attemptedValue: nextValue,
          currentValue: value
        });
        return; // Don't update if validation fails
      }
    }
    
    setValue(newValue);
  }, [value, setValue, validator, debugOptions.componentName, debugOptions.name]);

  return [value, setValueWithValidation, null] as const;
}
