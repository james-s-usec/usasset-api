/**
 * Debug Component Hook - Simplified Composition
 * Combines debug hooks following CLAUDE.md principles
 */

import { useRef } from 'react';
import { debug } from '../utils/debug';
import { useDebugLifecycle } from './useDebugLifecycle';
import { useDebugRender } from './useDebugRender';
import { useDebugProps } from './useDebugProps';
import { useDebugFunctions } from './useDebugFunctions';

interface UseDebugComponentOptions {
  name: string;
  props?: Record<string, unknown>;
  trackRenders?: boolean;
  trackProps?: boolean;
  trackPerformance?: boolean;
}

export interface DebugComponentReturn {
  debugState: {
    renderCount: number;
    lastRenderReason: string | null;
    mountTime: number;
    lastPropsChange: Record<string, unknown> | null;
  };
  logStateUpdate: (stateName: string, oldValue: unknown, newValue: unknown) => void;
  logEvent: (eventType: string, eventData?: unknown) => void;
  logCustom: (message: string, data?: unknown) => void;
  startTiming: (operationName: string) => string | undefined;
  endTiming: (markName?: string, operationName?: string) => void;
  isDebugEnabled: boolean;
}

export function useDebugComponent(options: UseDebugComponentOptions): DebugComponentReturn {
  const { name, props = {}, trackRenders = true, trackProps = true, trackPerformance = true } = options;
  
  const { renderCount: renderCountRef, mountTime: mountTimeRef } = useDebugLifecycle({
    name, props, trackPerformance
  });
  
  const lastPropsChangeRef = useRef<Record<string, unknown> | null>(null);
  const lastRenderReasonRef = useRef<string | null>(null);
  
  // Always call hooks, control with enabled flag (React rules)
  useDebugRender({ name, props, trackPerformance, enabled: trackRenders }, renderCountRef);
  useDebugProps({ name, props, enabled: trackProps }, lastPropsChangeRef);
  
  const functions = useDebugFunctions(name, trackPerformance);
  
  return {
    debugState: {
      renderCount: renderCountRef.current,
      lastRenderReason: lastRenderReasonRef.current,
      mountTime: mountTimeRef.current,
      lastPropsChange: lastPropsChangeRef.current
    },
    ...functions,
    isDebugEnabled: debug.enabled
  };
}

/**
 * Simplified debug hook for basic logging
 */
export function useSimpleDebug(
  componentName: string, 
  props?: Record<string, unknown>
): DebugComponentReturn {
  return useDebugComponent({
    name: componentName,
    props,
    trackRenders: false,
    trackProps: false,
    trackPerformance: false
  });
}

/**
 * Performance-focused debug hook
 */
export function usePerformanceDebug(
  componentName: string
): Pick<DebugComponentReturn, 'startTiming' | 'endTiming'> {
  const { startTiming, endTiming } = useDebugComponent({
    name: componentName,
    trackRenders: false,
    trackProps: false,
    trackPerformance: true
  });
  
  return { startTiming, endTiming };
}