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
  });
};

export const logStateStats = (
  componentName: string,
  name: string,
  hasChanged: boolean,
  prev: unknown,
  next: unknown,
  isFunc: boolean,
  updateCount: number,
  logAllChanges: boolean
): void => {
  if (!debug.enabled) return;
  if (!logAllChanges && !hasChanged) return;
  
  logStateChange(componentName, name, prev, next);
  
  debug.debugLog('state', `📊 ${componentName}.${name} stats`, {
    updateCount,
    hasChanged,
    previousType: typeof prev,
    nextType: typeof next,
    isFunction: isFunc
  });
};

export const shouldUpdateValue = <T>(
  prev: T,
  next: T,
  hasChanged: boolean,
  logOnlyChanged: boolean,
  compareFunction?: (prev: T, next: T) => boolean
): boolean => {
  const actuallyChanged = compareFunction ? 
    !compareFunction(prev, next) :
    prev !== next;
  
  return !(actuallyChanged === false && logOnlyChanged);
};