/**
 * Debug Lifecycle Hook
 * Tracks component mount/unmount following CLAUDE.md principles
 */

import { useEffect, useRef } from 'react';
import { debug, logComponentEntry, startPerformanceMark, endPerformanceMark } from '../utils/debug';

interface UseDebugLifecycleOptions {
  name: string;
  props?: Record<string, unknown>;
  trackPerformance?: boolean;
}

interface DebugLifecycleRefs {
  renderCount: React.MutableRefObject<number>;
  mountTime: React.MutableRefObject<number>;
}

export function useDebugLifecycle(options: UseDebugLifecycleOptions): DebugLifecycleRefs {
  const { name, props = {}, trackPerformance = true } = options;
  
  const renderCountRef = useRef(0);
  const mountTimeRef = useRef(Date.now());
  
  useEffect(() => {
    if (!debug.enabled) return;
    
    const mountTime = mountTimeRef.current;
    const mountMark = `${name}-mount`;
    
    if (trackPerformance) {
      startPerformanceMark(mountMark);
      setTimeout(() => endPerformanceMark(mountMark, 'mount'), 0);
    }
    
    logComponentEntry(name, props);
    
    return (): void => {
      debug.debugLog('lifecycle', `🔥 ${name} unmounting`, {
        renderCount: renderCountRef.current,
        lifetimeMs: Date.now() - mountTime
      });
    };
  }, [name, props, trackPerformance]);
  
  return { renderCount: renderCountRef, mountTime: mountTimeRef };
}