/**
 * Debug Effect Helper Functions
 * Utilities for effect debugging
 */

import type { DependencyList } from 'react';
import { logHookCall } from './debug';

export type DepChange = Record<string, { from: unknown; to: unknown }>;

export const analyzeDependencyChanges = (
  deps: DependencyList | undefined,
  prevDeps: DependencyList | undefined
): DepChange | undefined => {
  if (!deps || !prevDeps || deps.length !== prevDeps.length) return undefined;
  
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  deps.forEach((dep, index) => {
    if (dep !== prevDeps[index]) {
      changes[`dep[${index}]`] = { from: prevDeps[index], to: dep };
    }
  });
  
  return Object.keys(changes).length > 0 ? changes : undefined;
};

export const logEffectEntry = (
  fullName: string,
  runCount: number,
  deps: DependencyList | undefined,
  depChanges: DepChange | undefined
): void => {
  logHookCall(fullName, 'entry', {
    runCount,
    depsLength: deps?.length,
    depChanges,
    hasDeps: deps !== undefined,
    isFirstRun: runCount === 1
  });
};

export const createCleanupHandler = (
  cleanup: (() => void) | void,
  name: string,
  runCount: number,
  cleanupCountRef: React.MutableRefObject<number>
): (() => void) | void => {
  if (!cleanup) return cleanup;
  
  return (): void => {
    cleanupCountRef.current += 1;
    logHookCall(name, 'cleanup', {
      runCount,
      cleanupCount: cleanupCountRef.current
    });
    cleanup();
  };
};