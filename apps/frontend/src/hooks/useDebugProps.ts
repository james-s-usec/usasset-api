/**
 * Debug Props Hook
 * Tracks prop changes following CLAUDE.md principles
 */

import { useEffect, useRef } from 'react';
import { debug, logComponentEntry } from '../utils/debug';

interface UseDebugPropsOptions {
  name: string;
  props: Record<string, unknown>;
  enabled?: boolean;
}

export function useDebugProps(
  options: UseDebugPropsOptions,
  lastPropsChangeRef: React.MutableRefObject<Record<string, unknown> | null>
): void {
  const { name, props, enabled = true } = options;
  const prevPropsRef = useRef<Record<string, unknown>>(props);
  
  useEffect(() => {
    if (!debug.enabled || !enabled) return;
    
    const changedProps: Record<string, unknown> = {};
    let hasChanges = false;
    
    Object.keys(props).forEach(key => {
      if (props[key] !== prevPropsRef.current[key]) {
        changedProps[key] = {
          from: prevPropsRef.current[key],
          to: props[key]
        };
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      debug.debugLog('component', `${name} props changed`, changedProps);
      lastPropsChangeRef.current = changedProps;
    }
    
    prevPropsRef.current = props;
  }, [props, enabled, name, lastPropsChangeRef]);
}