/**
 * Effect Debug Hook
 * 
 * Enhanced useEffect with automatic debug logging
 * Follows CLAUDE.md principles for effect debugging and cleanup tracking
 */

import { useEffect, useRef } from 'react';
import type { DependencyList, EffectCallback } from 'react';
import { debug } from '../utils/debug';
import { 
  analyzeDependencyChanges, 
  logEffectEntry, 
  createCleanupHandler 
} from '../utils/debug-effect-helpers';

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

    runCountRef.current += 1;
    const runCount = runCountRef.current;
    const fullName = `${componentName}.${name}`;
    
    const depChanges = logDependencies 
      ? analyzeDependencyChanges(deps, prevDepsRef.current)
      : undefined;

    logEffectEntry(fullName, runCount, deps, depChanges);

    const cleanup = effect();
    prevDepsRef.current = deps;

    return logCleanup
      ? createCleanupHandler(cleanup, fullName, runCount, cleanupCountRef)
      : cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Debug version of useEffect for API calls
 */
async function executeApiCall(
  apiCall: () => Promise<void> | void,
  name: string,
  logDetails: boolean
): Promise<void> {
  if (debug.enabled && logDetails) {
    debug.debugLog('api', `🚀 ${name} starting API call`);
  }
  
  const result = await apiCall();
  
  if (debug.enabled && logDetails) {
    debug.debugLog('api', `✅ ${name} API call completed`, { result });
  }
}

function handleApiError(
  error: unknown,
  name: string,
  onError?: (error: unknown) => void
): void {
  if (debug.enabled) {
    debug.debugLog('api', `❌ ${name} API call failed`, { error });
  }
  
  if (onError) {
    onError(error);
  } else {
    console.error(`API effect error in ${name}:`, error);
  }
}

export function useDebugApiEffect(
  apiCall: () => Promise<void> | void,
  deps: DependencyList | undefined,
  options: UseDebugEffectOptions & {
    onError?: (error: unknown) => void;
    logApiDetails?: boolean;
  }
): void {
  const { onError, logApiDetails = true, ...effectOptions } = options;
  const fullName = `${effectOptions.componentName}.${effectOptions.name}`;

  useDebugEffect(
    () => {
      const run = async (): Promise<void> => {
        try {
          await executeApiCall(apiCall, fullName, logApiDetails);
        } catch (error) {
          handleApiError(error, fullName, onError);
        }
      };
      void run();
    },
    deps,
    effectOptions
  );
}

/**
 * Debug version of useEffect with timeout tracking
 */
function setupTimeout(
  effect: EffectCallback,
  timeout: number,
  name: string
): () => void {
  const timeoutId = setTimeout((): void => {
    if (debug.enabled) {
      debug.debugLog('lifecycle', `⏰ ${name} timeout triggered`, { timeout });
    }
    effect();
  }, timeout);

  return (): void => {
    clearTimeout(timeoutId);
    if (debug.enabled) {
      debug.debugLog('lifecycle', `⏰ ${name} timeout cleared`, { timeout });
    }
  };
}

function setupInterval(
  effect: EffectCallback,
  interval: number,
  name: string
): () => void {
  const intervalId = setInterval((): void => {
    if (debug.enabled) {
      debug.debugLog('lifecycle', `🔄 ${name} interval triggered`, { interval });
    }
    effect();
  }, interval);

  return (): void => {
    clearInterval(intervalId);
    if (debug.enabled) {
      debug.debugLog('lifecycle', `🔄 ${name} interval cleared`, { interval });
    }
  };
}

export function useDebugTimerEffect(
  effect: EffectCallback,
  deps: DependencyList | undefined,
  options: UseDebugEffectOptions & {
    timeout?: number;
    interval?: number;
  }
): void {
  const { timeout, interval, ...effectOptions } = options;
  const fullName = `${effectOptions.componentName}.${effectOptions.name}`;

  useDebugEffect(
    () => {
      if (timeout) return setupTimeout(effect, timeout, fullName);
      if (interval) return setupInterval(effect, interval, fullName);
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
    (): (() => void) | void => {
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