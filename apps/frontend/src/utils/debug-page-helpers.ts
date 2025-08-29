/**
 * Debug Page Helper Functions
 * Extracted from DebugPage component for CLAUDE.md compliance
 */

import { createAsyncDebugHandler, createDebugHandler } from './debug-handler-helpers';
import type { UseDebugPageReturn } from '../hooks/useDebugPage';

interface DebugLogger {
  logEvent: (event: string, data?: unknown) => void;
  logCustom: (message: string, data?: unknown) => void;
  startTiming: (name: string) => string | undefined;
  endTiming: (mark?: string, name?: string) => void;
}

export const createDebugPageHandlers = (
  pageData: UseDebugPageReturn,
  debug: DebugLogger
): {
  refresh: () => Promise<void>;
  testUI: () => void;
  clearLogs: () => Promise<void>;
  copyJSON: () => void;
  copyDebug: () => void;
  metadata: (open: boolean, data?: unknown, title?: string) => void;
} => ({
  refresh: createAsyncDebugHandler(pageData.handleRefresh, 'refresh-logs', debug),
  testUI: createDebugHandler(pageData.handleTestUIEvent, 'test-ui-event', debug, 'Test UI event triggered'),
  clearLogs: createAsyncDebugHandler(pageData.handleClearLogs, 'clear-logs', debug),
  copyJSON: createDebugHandler(pageData.handleCopyLogsAsJSON, 'copy-logs-json', debug, 'Copied logs as JSON'),
  copyDebug: createDebugHandler(pageData.handleCopyDebugInfo, 'copy-debug-info', debug, 'Copied debug info'),
  metadata: (open: boolean, data?: unknown, title?: string): void => {
    const event = open ? 'open-metadata-dialog' : 'close-metadata-dialog';
    debug.logEvent(event, { title });
    pageData.handleMetadataDialog(open, data, title);
  }
});

export const logDebugPageState = (
  debug: DebugLogger,
  pageData: UseDebugPageReturn
): void => {
  debug.logCustom('DebugPage state', {
    logsCount: pageData.logs.length,
    loading: pageData.loading,
    hasError: !!pageData.error,
    metadataDialogOpen: pageData.metadataDialog.open
  });
};