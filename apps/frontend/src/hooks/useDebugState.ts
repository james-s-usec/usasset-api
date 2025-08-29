/**
 * State Debug Hook
 * 
 * Enhanced useState with automatic debug logging
 * Follows CLAUDE.md principle: "Log intermediate results"
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { logStateChange, debug } from '../utils/debug';

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
  const setCountRef = useRef(0);

  // Log initial state
  useEffect(() => {
    if (!debug.enabled) return;
    debug.debugLog('state', `🎬 ${componentName}.${name} initialized`, {
      initialValue,
      type: typeof initialValue
    });
  }, [componentName, name, initialValue]); // Dependencies for initialization logging

  const setValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setValueInternal(prev => {
      const nextValue = typeof newValue === 'function' ? (newValue as (prev: T) => T)(prev) : newValue;
      
      // Check if value actually changed
      const hasChanged = compareFunction ? 
        !compareFunction(prev, nextValue) :
        prev !== nextValue;

      if (!hasChanged && logOnlyChanged) {
        return prev; // Don't update if no change
      }

      // Log the state change
      if (debug.enabled && (logAllChanges || hasChanged)) {
        setCountRef.current += 1;
        logStateChange(componentName, name, prev, nextValue);
        
        debug.debugLog('state', `📊 ${componentName}.${name} stats`, {
          updateCount: setCountRef.current,
          hasChanged,
          previousType: typeof prev,
          nextType: typeof nextValue,
          isFunction: typeof newValue === 'function'
        });
      }

      prevValueRef.current = nextValue;
      return nextValue;
    });
  }, [name, componentName, logAllChanges, logOnlyChanged, compareFunction]);

  return [value, setValue];
}

/**
 * Debug state for objects with deep comparison
 */
export function useDebugObjectState<T extends Record<string, unknown>>(
  initialValue: T,
  options: Omit<UseDebugStateOptions<T>, 'compareFunction'>
) {
  return useDebugState(initialValue, {
    ...options,
    compareFunction: (prev, next) => JSON.stringify(prev) === JSON.stringify(next)
  });
}

/**
 * Debug state for arrays with deep comparison
 */
export function useDebugArrayState<T>(
  initialValue: T[],
  options: Omit<UseDebugStateOptions<T[]>, 'compareFunction'>
) {
  return useDebugState(initialValue, {
    ...options,
    compareFunction: (prev, next) => {
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
) {
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

  return [value, setValueWithValidation] as const;
}