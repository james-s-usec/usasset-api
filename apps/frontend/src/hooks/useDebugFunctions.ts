/**
 * Debug Functions Hook
 * Provides debug callback functions following CLAUDE.md principles
 */

import { useCallback } from 'react';
import { debug, logStateChange, startPerformanceMark, endPerformanceMark } from '../utils/debug';

interface DebugFunctions {
  logStateUpdate: (stateName: string, oldValue: unknown, newValue: unknown) => void;
  logEvent: (eventType: string, eventData?: unknown) => void;
  logCustom: (message: string, data?: unknown) => void;
  startTiming: (operationName: string) => string | undefined;
  endTiming: (markName?: string, operationName?: string) => void;
}

export function useDebugFunctions(name: string, trackPerformance: boolean): DebugFunctions {
  const logStateUpdate = useCallback((stateName: string, oldValue: unknown, newValue: unknown): void => {
    if (!debug.enabled) return;
    logStateChange(name, stateName, oldValue, newValue);
  }, [name]);
  
  const logEvent = useCallback((eventType: string, eventData?: unknown): void => {
    if (!debug.enabled) return;
    debug.logEvent(eventType, name, eventData);
  }, [name]);
  
  const logCustom = useCallback((message: string, data?: unknown): void => {
    if (!debug.enabled) return;
    debug.debugLog('component', `${name}: ${message}`, data);
  }, [name]);
  
  const startTiming = useCallback((operationName: string): string | undefined => {
    if (!debug.enabled || !trackPerformance) return undefined;
    const markName = `${name}-${operationName}-${Date.now()}`;
    startPerformanceMark(markName);
    return markName;
  }, [name, trackPerformance]);
  
  const endTiming = useCallback((markName?: string, operationName?: string): void => {
    if (!debug.enabled || !trackPerformance || !markName) return;
    endPerformanceMark(markName, operationName);
  }, [trackPerformance]);
  
  return { logStateUpdate, logEvent, logCustom, startTiming, endTiming };
}