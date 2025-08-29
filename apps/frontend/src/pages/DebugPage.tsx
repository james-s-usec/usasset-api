import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useDebugPage } from '../hooks/useDebugPage';
import { useDebugComponent } from '../hooks/useDebugComponent';
import { DebugPageHeader } from '../components/DebugPageHeader';
import { LogsDataGrid } from '../components/LogsDataGrid';
import { MetadataDialog } from '../components/MetadataDialog';

interface DebugLoggers {
  logEvent: (type: string, data?: unknown) => void;
  logCustom: (msg: string, data?: unknown) => void;
  startTiming: (name: string) => string | undefined;
  endTiming: (mark?: string, name?: string) => void;
}

const createDebugHandler = <T extends unknown[], R>(
  handler: (...args: T) => R,
  eventName: string,
  debug: Pick<DebugLoggers, 'logEvent' | 'logCustom'>,
  successMsg?: string
) => {
  return (...args: T): R => {
    debug.logEvent('click', eventName);
    const result = handler(...args);
    if (successMsg) debug.logCustom(successMsg);
    return result;
  };
};

const createAsyncDebugHandler = <T extends unknown[]>(
  handler: (...args: T) => Promise<void>,
  eventName: string,
  debug: DebugLoggers
) => {
  return async (...args: T): Promise<void> => {
    debug.logEvent('click', eventName);
    const mark = debug.startTiming(eventName);
    
    try {
      await handler(...args);
      debug.endTiming(mark, `${eventName}-success`);
      debug.logCustom(`${eventName} completed`);
    } catch (error) {
      debug.endTiming(mark, `${eventName}-error`);
      debug.logCustom(`${eventName} failed`, { error });
      throw error;
    }
  };
};

export const DebugPage = (): React.ReactElement => {
  const debug = useDebugComponent({
    name: 'DebugPage',
    trackRenders: true,
    trackPerformance: true
  });

  const pageData = useDebugPage();

  const handlers = {
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
  };

  debug.logCustom('DebugPage state', {
    logsCount: pageData.logs.length,
    loading: pageData.loading,
    hasError: !!pageData.error,
    metadataDialogOpen: pageData.metadataDialog.open
  })

  if (pageData.loading) {
    debug.logCustom('Showing loading state');
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading debug logs...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <DebugPageHeader
        logsCount={pageData.logs.length}
        error={pageData.error}
        onRefresh={handlers.refresh}
        onTestUIEvent={handlers.testUI}
        onCopyLogsAsJSON={handlers.copyJSON}
        onCopyDebugInfo={handlers.copyDebug}
        onClearLogs={handlers.clearLogs}
      />
      
      <LogsDataGrid
        logs={pageData.logs}
        onViewMetadata={(data, title) => handlers.metadata(true, data, title)}
      />

      <MetadataDialog
        open={pageData.metadataDialog.open}
        data={pageData.metadataDialog.data}
        title={pageData.metadataDialog.title}
        onClose={() => handlers.metadata(false)}
      />
    </Box>
  );
};