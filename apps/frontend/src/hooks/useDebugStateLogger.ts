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
}

export function useDebugStateLogger({
  componentName,
  name,
  initialValue,
  logAllChanges
}: UseDebugStateLoggerProps): { logStats: (hasChanged: boolean, prev: unknown, next: unknown, isFunc: boolean) => void } {
  const setCountRef = useRef(0);

  useEffect(() => {
    logStateInitialization(componentName, name, initialValue);
  }, [componentName, name, initialValue]);

  const logStats = useCallback((hasChanged: boolean, prev: unknown, next: unknown, isFunc: boolean): void => {
    setCountRef.current += 1;
    logStateStats({
      componentName,
      name,
      hasChanged,
      prev,
      next,
      isFunc,
      updateCount: setCountRef.current,
      logAllChanges
    });
  }, [componentName, name, logAllChanges]);

  return { logStats };
}