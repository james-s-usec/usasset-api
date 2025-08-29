/**
 * State Debug Hook
 * 
 * Enhanced useState with automatic debug logging
 * Follows CLAUDE.md principle: "Log intermediate results"
 */

import { useState, useCallback, useRef } from 'react';
import { useDebugStateLogger } from './useDebugStateLogger';

interface UseDebugStateOptions<T> {
  name: string;
  componentName?: string;
  logAllChanges?: boolean;
  logOnlyChanged?: boolean;
  compareFunction?: (prev: T, next: T) => boolean;
}

export function useDebugState<T>(
  initialValue: T,
  options: UseDebugStateOptions<T>
): [T, (newValue: T | ((prev: T) => T)) => void] {
  const { name, componentName = 'Unknown', logAllChanges = true, logOnlyChanged = true, compareFunction } = options;
  
  const [value, setValueInternal] = useState<T>(initialValue);
  const prevValueRef = useRef<T>(initialValue);
  const { logStats } = useDebugStateLogger({
    componentName,
    name,
    initialValue,
    logAllChanges
  });

  const setValue = useCallback((newValue: T | ((prev: T) => T)): void => {
    setValueInternal((prev: T) => {
      const isFunc = typeof newValue === 'function';
      const next = isFunc ? (newValue as (prev: T) => T)(prev) : newValue;
      
      const hasChanged = compareFunction ? 
        !compareFunction(prev, next) :
        prev !== next;

      if (!hasChanged && logOnlyChanged) return prev;

      logStats(hasChanged, prev, next, isFunc);
      prevValueRef.current = next;
      return next;
    });
  }, [logOnlyChanged, compareFunction, logStats]);

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