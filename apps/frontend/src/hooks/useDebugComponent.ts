/**
 * Component Debug Hook
 * 
 * Provides component-level debug logging following CLAUDE.md principles:
 * - Log entry points with parameters
 * - Log state changes
 * - Track component lifecycle
 * - Performance monitoring
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { debug, logComponentEntry, logStateChange, logRender, startPerformanceMark, endPerformanceMark } from '../utils/debug';

interface UseDebugComponentOptions {
  name: string;
  props?: Record<string, unknown>;
  trackRenders?: boolean;
  trackProps?: boolean;
  trackPerformance?: boolean;
}

interface DebugComponentState {
  renderCount: number;
  lastRenderReason: string | null;
  mountTime: number;
  lastPropsChange: Record<string, unknown> | null;
}

export function useDebugComponent(options: UseDebugComponentOptions) {
  const { name, props = {}, trackRenders = true, trackProps = true, trackPerformance = true } = options;
  
  const [state, setState] = useState<DebugComponentState>({
    renderCount: 0,
    lastRenderReason: null,
    mountTime: Date.now(),
    lastPropsChange: null
  });
  
  const prevPropsRef = useRef<Record<string, unknown>>(props);
  const renderReasonRef = useRef<string>('initial');
  const performanceMarkRef = useRef<string>(`${name}-render`);

  // Track component mount
  useEffect(() => {
    if (!debug.enabled) return;

    const mountMark = `${name}-mount`;
    startPerformanceMark(mountMark);
    
    logComponentEntry(name, props);
    
    // Log mount completion
    setTimeout(() => {
      endPerformanceMark(mountMark, 'component mount');
    }, 0);

    // Cleanup on unmount
    return () => {
      debug.debugLog('lifecycle', `🔥 ${name} unmounting`, {
        renderCount: state.renderCount,
        lifetimeMs: Date.now() - state.mountTime
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]); // Only name dependency for mount/unmount, state values would cause re-runs

  // Track props changes
  useEffect(() => {
    if (!debug.enabled || !trackProps) return;

    const prevProps = prevPropsRef.current;
    const changedProps: Record<string, { from: unknown; to: unknown }> = {};
    let hasChanges = false;

    // Compare each prop
    for (const [key, value] of Object.entries(props)) {
      if (prevProps[key] !== value) {
        changedProps[key] = { from: prevProps[key], to: value };
        hasChanges = true;
      }
    }

    // Check for removed props
    for (const key of Object.keys(prevProps)) {
      if (!(key in props)) {
        changedProps[key] = { from: prevProps[key], to: undefined };
        hasChanges = true;
      }
    }

    if (hasChanges) {
      renderReasonRef.current = 'props change';
      logStateChange(name, 'props', prevProps, props);
      
      setState(prev => ({
        ...prev,
        lastPropsChange: changedProps
      }));
    }

    prevPropsRef.current = props;
  }, [props, trackProps, name]);

  // Track renders
  useEffect(() => {
    if (!debug.enabled || !trackRenders) return;

    setState(prev => {
      const newState = {
        ...prev,
        renderCount: prev.renderCount + 1,
        lastRenderReason: renderReasonRef.current
      };

      // Log render with performance tracking
      if (trackPerformance) {
        const markName = `${performanceMarkRef.current}-${newState.renderCount}`;
        startPerformanceMark(markName);
        
        // End performance mark on next tick
        setTimeout(() => {
          endPerformanceMark(markName, `render #${newState.renderCount}`);
        }, 0);
      }

      logRender(name, renderReasonRef.current, {
        renderCount: newState.renderCount,
        props: Object.keys(props),
        propsCount: Object.keys(props).length
      });

      // Reset render reason for next render
      renderReasonRef.current = 'unknown';

      return newState;
    });
  }, [trackRenders, trackPerformance, name, props]);

  // Debug functions to expose
  const logStateUpdate = useCallback((stateName: string, oldValue: unknown, newValue: unknown) => {
    if (!debug.enabled) return;
    renderReasonRef.current = `${stateName} state change`;
    logStateChange(name, stateName, oldValue, newValue);
  }, [name]);

  const logEvent = useCallback((eventType: string, eventData?: unknown) => {
    if (!debug.enabled) return;
    debug.logEvent(eventType, name, eventData);
  }, [name]);

  const logCustom = useCallback((message: string, data?: unknown) => {
    if (!debug.enabled) return;
    debug.debugLog('component', `${name}: ${message}`, data);
  }, [name]);

  const startTiming = useCallback((operationName: string) => {
    if (!debug.enabled || !trackPerformance) return;
    const markName = `${name}-${operationName}`;
    startPerformanceMark(markName);
    return markName;
  }, [name, trackPerformance]);

  const endTiming = useCallback((markName?: string, operationName?: string) => {
    if (!debug.enabled || !trackPerformance) return;
    if (markName) {
      return endPerformanceMark(markName, operationName);
    }
  }, [trackPerformance]);

  return {
    // Debug state
    debugState: state,
    
    // Debug functions
    logStateUpdate,
    logEvent,
    logCustom,
    startTiming,
    endTiming,
    
    // Utility
    isDebugEnabled: debug.enabled
  };
}

/**
 * Simplified component debug hook for basic logging
 */
export function useSimpleDebug(componentName: string, props?: Record<string, unknown>) {
  return useDebugComponent({
    name: componentName,
    props,
    trackRenders: true,
    trackProps: true,
    trackPerformance: false
  });
}

/**
 * Performance-focused debug hook
 */
export function usePerformanceDebug(componentName: string, props?: Record<string, unknown>) {
  return useDebugComponent({
    name: componentName,
    props,
    trackRenders: true,
    trackProps: false,
    trackPerformance: true
  });
}