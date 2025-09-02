/**
 * Debug State Logger Hook
 * Handles logging for debug state
 */

import { useEffect, useRef, useCallback } from 'react';
import { logStateInitialization, logStateStats } from '../utils/debug-state-helpers';

interface UseDebugStateLoggerProps {
  componentName: string;
  name: string;
  initialValue: unknown;
  logAllChanges: boolean;
  disabled?: boolean;
}

export function useDebugStateLogger({
  componentName,
  name,
  initialValue,
  logAllChanges,
  disabled = false
}: UseDebugStateLoggerProps): { logStats: (hasChanged: boolean, prev: unknown, next: unknown, isFunc: boolean) => void } {
  const setCountRef = useRef(0);

  useEffect(() => {
    if (!disabled) {
      logStateInitialization(componentName, name, initialValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only log initialization once on mount

  // Use refs to keep stable reference for logStats
  const componentNameRef = useRef(componentName);
  const nameRef = useRef(name);
  const logAllChangesRef = useRef(logAllChanges);
  
  // Update refs when props change
  useEffect(() => {
    componentNameRef.current = componentName;
    nameRef.current = name;
    logAllChangesRef.current = logAllChanges;
  }, [componentName, name, logAllChanges]);

  const logStats = useCallback((hasChanged: boolean, prev: unknown, next: unknown, isFunc: boolean): void => {
    if (disabled) return; // Skip logging if disabled
    
    setCountRef.current += 1;
    logStateStats({
      componentName: componentNameRef.current,
      name: nameRef.current,
      hasChanged,
      prev,
      next,
      isFunc,
      updateCount: setCountRef.current,
      logAllChanges: logAllChangesRef.current
    });
  }, [disabled]); // Include disabled in deps

  return { logStats };
}