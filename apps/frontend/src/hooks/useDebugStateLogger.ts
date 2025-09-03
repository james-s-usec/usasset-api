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

// Helper function for creating stats logger
function createStatsLogger(
  setCountRef: React.MutableRefObject<number>,
  refs: {
    componentName: React.MutableRefObject<string>;
    name: React.MutableRefObject<string>;
    logAllChanges: React.MutableRefObject<boolean>;
  },
  disabled: boolean
) {
  return (hasChanged: boolean, prev: unknown, next: unknown, isFunc: boolean): void => {
    if (disabled) return;
    
    setCountRef.current += 1;
    logStateStats({
      componentName: refs.componentName.current,
      name: refs.name.current,
      hasChanged,
      prev,
      next,
      isFunc,
      updateCount: setCountRef.current,
      logAllChanges: refs.logAllChanges.current
    });
  };
}

export function useDebugStateLogger({
  componentName,
  name,
  initialValue,
  logAllChanges,
  disabled = false
}: UseDebugStateLoggerProps): { logStats: (hasChanged: boolean, prev: unknown, next: unknown, isFunc: boolean) => void } {
  const setCountRef = useRef(0);
  const componentNameRef = useRef(componentName);
  const nameRef = useRef(name);
  const logAllChangesRef = useRef(logAllChanges);

  useEffect(() => {
    if (!disabled) {
      logStateInitialization(componentName, name, initialValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    componentNameRef.current = componentName;
    nameRef.current = name;
    logAllChangesRef.current = logAllChanges;
  }, [componentName, name, logAllChanges]);

  const logStats = useCallback(() => createStatsLogger(setCountRef, {
    componentName: componentNameRef,
    name: nameRef,
    logAllChanges: logAllChangesRef
  }, disabled), [disabled]);

  return { logStats };
}