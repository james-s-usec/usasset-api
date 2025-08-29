/**
 * Debug Render Hook
 * Tracks component renders following CLAUDE.md principles
 */

import { useEffect, useRef } from 'react';
import { debug, logRender, startPerformanceMark, endPerformanceMark } from '../utils/debug';

interface UseDebugRenderOptions {
  name: string;
  props?: Record<string, unknown>;
  trackPerformance?: boolean;
  enabled?: boolean;
}

export function useDebugRender(
  options: UseDebugRenderOptions,
  renderCountRef: React.MutableRefObject<number>
): void {
  const { name, props = {}, trackPerformance = true, enabled = true } = options;
  
  const renderReasonRef = useRef<string>('initial');
  const performanceMarkRef = useRef<string>(`${name}-render`);
  
  // Increment on every render
  renderCountRef.current += 1;
  const currentRenderCount = renderCountRef.current;
  
  useEffect(() => {
    if (!debug.enabled || !enabled) return;
    
    if (trackPerformance) {
      const markName = `${performanceMarkRef.current}-${currentRenderCount}`;
      startPerformanceMark(markName);
      setTimeout(() => endPerformanceMark(markName, `render #${currentRenderCount}`), 0);
    }
    
    logRender(name, renderReasonRef.current, {
      renderCount: currentRenderCount,
      props: Object.keys(props),
      propsCount: Object.keys(props).length
    });
    
    renderReasonRef.current = 'unknown';
  });
}