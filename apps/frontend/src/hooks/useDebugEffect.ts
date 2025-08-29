/**
 * Effect Debug Hook
 * 
 * Enhanced useEffect with automatic debug logging
 * Follows CLAUDE.md principles for effect debugging and cleanup tracking
 */

import { useEffect, useRef } from 'react';
import type { DependencyList, EffectCallback } from 'react';
import { logHookCall, debug } from '../utils/debug';

interface UseDebugEffectOptions {
  name: string;
  componentName?: string;
  logDependencies?: boolean;
  logCleanup?: boolean;
  trackRuns?: boolean;
}

export function useDebugEffect(
  effect: EffectCallback,
  deps: DependencyList | undefined,
  options: UseDebugEffectOptions
): void {
  const { name, componentName = 'Unknown', logDependencies = true, logCleanup = true } = options;
  
  const prevDepsRef = useRef<DependencyList | undefined>(deps);
  const runCountRef = useRef(0);
  const cleanupCountRef = useRef(0);

  useEffect(() => {
    if (!debug.enabled) return effect();

    // Log effect entry
    runCountRef.current += 1;
    const runCount = runCountRef.current;
    
    // Analyze dependency changes
    let depChanges: Record<string, { from: unknown; to: unknown }> | undefined;
    if (logDependencies && deps && prevDepsRef.current && deps.length === prevDepsRef.current.length) {
      depChanges = {};
      deps.forEach((dep, index) => {
        const prevDep = prevDepsRef.current![index];
        if (dep !== prevDep) {
          depChanges![`dep[${index}]`] = { from: prevDep, to: dep };
        }
      });
    }

    logHookCall(`${componentName}.${name}`, 'entry', {
      runCount,
      depsLength: deps?.length,
      depChanges: Object.keys(depChanges || {}).length > 0 ? depChanges : undefined,
      hasDeps: deps !== undefined,
      isFirstRun: runCount === 1
    });

    // Call the original effect
    const cleanup = effect();

    // Store current deps for next comparison
    prevDepsRef.current = deps;

    // Return wrapped cleanup function
    if (cleanup && logCleanup) {
      return () => {
        cleanupCountRef.current += 1;
        logHookCall(`${componentName}.${name}`, 'cleanup', {
          runCount,
          cleanupCount: cleanupCountRef.current
        });
        cleanup();
      };
    }

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Debug version of useEffect for API calls
 */
export function useDebugApiEffect(
  apiCall: () => Promise<void> | void,
  deps: DependencyList | undefined,
  options: UseDebugEffectOptions & {
    onError?: (error: unknown) => void;
    logApiDetails?: boolean;
  }
): void {
  const { onError, logApiDetails = true, ...effectOptions } = options;

  useDebugEffect(
    () => {
      const handleApiCall = async () => {
        try {
          if (debug.enabled && logApiDetails) {
            debug.debugLog('api', `🚀 ${effectOptions.componentName}.${effectOptions.name} starting API call`);
          }
          
          const result = await apiCall();
          
          if (debug.enabled && logApiDetails) {
            debug.debugLog('api', `✅ ${effectOptions.componentName}.${effectOptions.name} API call completed`, { result });
          }
        } catch (error) {
          if (debug.enabled) {
            debug.debugLog('api', `❌ ${effectOptions.componentName}.${effectOptions.name} API call failed`, { error });
          }
          
          if (onError) {
            onError(error);
          } else {
            console.error(`API effect error in ${effectOptions.componentName}.${effectOptions.name}:`, error);
          }
        }
      };

      handleApiCall();
    },
    deps,
    effectOptions
  );
}

/**
 * Debug version of useEffect with timeout tracking
 */
export function useDebugTimerEffect(
  effect: EffectCallback,
  deps: DependencyList | undefined,
  options: UseDebugEffectOptions & {
    timeout?: number;
    interval?: number;
  }
): void {
  const { timeout, interval, ...effectOptions } = options;

  useDebugEffect(
    () => {
      if (timeout) {
        const timeoutId = setTimeout(() => {
          if (debug.enabled) {
            debug.debugLog('lifecycle', `⏰ ${effectOptions.componentName}.${effectOptions.name} timeout triggered`, { timeout });
          }
          effect();
        }, timeout);

        return () => {
          clearTimeout(timeoutId);
          if (debug.enabled) {
            debug.debugLog('lifecycle', `⏰ ${effectOptions.componentName}.${effectOptions.name} timeout cleared`, { timeout });
          }
        };
      }

      if (interval) {
        const intervalId = setInterval(() => {
          if (debug.enabled) {
            debug.debugLog('lifecycle', `🔄 ${effectOptions.componentName}.${effectOptions.name} interval triggered`, { interval });
          }
          effect();
        }, interval);

        return () => {
          clearInterval(intervalId);
          if (debug.enabled) {
            debug.debugLog('lifecycle', `🔄 ${effectOptions.componentName}.${effectOptions.name} interval cleared`, { interval });
          }
        };
      }

      return effect();
    },
    deps,
    effectOptions
  );
}

/**
 * Debug version of useEffect for tracking mount/unmount only
 */
export function useDebugMountEffect(
  onMount: () => void | (() => void),
  options: Pick<UseDebugEffectOptions, 'componentName' | 'name'>
): void {
  useDebugEffect(
    () => {
      const cleanup = onMount();
      return cleanup;
    },
    [], // Empty deps for mount/unmount only
    {
      ...options,
      logDependencies: false // No deps to log
    }
  );
}