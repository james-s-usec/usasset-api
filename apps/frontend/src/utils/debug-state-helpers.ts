/**
 * Debug State Helper Functions
 * Utilities for state debugging
 */

import { logStateChange, debug } from './debug';

export const logStateInitialization = (
  componentName: string,
  name: string,
  initialValue: unknown
): void => {
  if (!debug.enabled) return;
  debug.debugLog('state', `🎬 ${componentName}.${name} initialized`, {
    initialValue,
    type: typeof initialValue
  }, { skipBackend: true });
};

export const logStateStats = (params: {
  componentName: string;
  name: string;
  hasChanged: boolean;
  prev: unknown;
  next: unknown;
  isFunc: boolean;
  updateCount: number;
  logAllChanges: boolean;
}): void => {
  const { componentName, name, hasChanged, prev, next, isFunc, updateCount, logAllChanges } = params;
  if (!debug.enabled) return;
  if (!logAllChanges && !hasChanged) return;
  
  logStateChange(componentName, name, prev, next);
  
  debug.debugLog('state', `📊 ${componentName}.${name} stats`, {
    updateCount,
    hasChanged,
    previousType: typeof prev,
    nextType: typeof next,
    isFunction: isFunc
  }, { skipBackend: true });
};

export const shouldUpdateValue = <T>(params: {
  prev: T;
  next: T;
  logOnlyChanged: boolean;
  compareFunction?: (prev: T, next: T) => boolean;
}): boolean => {
  const { prev, next, logOnlyChanged, compareFunction } = params;
  const actuallyChanged = compareFunction ? 
    !compareFunction(prev, next) :
    prev !== next;
  
  return !(actuallyChanged === false && logOnlyChanged);
};
