/**
 * Debug Tracker Helper Functions
 * Utilities for component tracking
 */

import { DebugLogger } from '../services/debug-logger';

export type ChangeRecord = Record<string, { old: unknown; new: unknown }>;

export const trackChanges = <T extends Record<string, unknown>>(
  current: T | undefined,
  previous: T | undefined
): ChangeRecord => {
  const changes: Record<string, { old: unknown; new: unknown }> = {};
  if (!current || !previous) return changes;
  
  Object.keys(current).forEach((key) => {
    if (current[key] !== previous[key]) {
      changes[key] = { old: previous[key], new: current[key] };
    }
  });
  
  return changes;
};

export const logMountEvent = (
  name: string, 
  props?: Record<string, unknown>, 
  state?: Record<string, unknown>, 
  time?: number
): void => {
  DebugLogger.logInfo(`${name}: Component mounted`, {
    props,
    state,
    mountTime: time ? new Date(time).toISOString() : new Date().toISOString()
  });
};

interface RenderLogData {
  name: string;
  renderCount: number;
  propsChanged: ChangeRecord;
  stateChanged: ChangeRecord;
  mountTime: number;
}

export const logRenderChanges = (data: RenderLogData): void => {
  DebugLogger.logInfo(`${data.name}: Re-render`, {
    renderCount: data.renderCount,
    propsChanged: data.propsChanged,
    stateChanged: data.stateChanged,
    timeSinceMount: Date.now() - data.mountTime
  });
};

export const logUnmountEvent = (
  componentName: string, 
  totalRenders: number, 
  startTime: number
): void => {
  DebugLogger.logInfo(`${componentName}: Component unmounted`, {
    totalRenders,
    lifetimeMs: Date.now() - startTime
  });
};