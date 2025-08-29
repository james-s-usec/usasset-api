import { Box, Typography, CircularProgress } from '@mui/material';
import { useDebugPage } from '../hooks/useDebugPage';
import { useDebugComponent } from '../hooks/useDebugComponent';
import { DebugPageHeader } from '../components/DebugPageHeader';
import { LogsDataGrid } from '../components/LogsDataGrid';
import { MetadataDialog } from '../components/MetadataDialog';

export const DebugPage = () => {
  // Debug logging for DebugPage itself
  const { logEvent, logCustom, startTiming, endTiming } = useDebugComponent({
    name: 'DebugPage',
    trackRenders: true,
    trackPerformance: true
  });

  const {
    logs,
    loading,
    error,
    metadataDialog,
    handleRefresh,
    handleTestUIEvent,
    handleClearLogs,
    handleCopyLogsAsJSON,
    handleCopyDebugInfo,
    handleMetadataDialog,
  } = useDebugPage();

  // Enhanced event handlers with debug logging
  const handleRefreshWithDebug = async () => {
    logEvent('click', 'refresh-logs')
    const timingMark = startTiming('refresh-logs')
    
    try {
      await handleRefresh()
      endTiming(timingMark, 'refresh-logs-success')
      logCustom('Logs refreshed successfully', { logsCount: logs.length })
    } catch (error) {
      endTiming(timingMark, 'refresh-logs-error')
      logCustom('Failed to refresh logs', { error })
      throw error
    }
  }

  const handleTestUIEventWithDebug = () => {
    logEvent('click', 'test-ui-event')
    handleTestUIEvent()
    logCustom('Test UI event triggered')
  }

  const handleClearLogsWithDebug = async () => {
    logEvent('click', 'clear-logs')
    logCustom('Clearing logs', { currentLogsCount: logs.length })
    await handleClearLogs()
  }

  const handleCopyLogsAsJSONWithDebug = () => {
    logEvent('click', 'copy-logs-json')
    handleCopyLogsAsJSON()
    logCustom('Copied logs as JSON', { logsCount: logs.length })
  }

  const handleCopyDebugInfoWithDebug = () => {
    logEvent('click', 'copy-debug-info')
    handleCopyDebugInfo()
    logCustom('Copied debug info')
  }

  const handleMetadataDialogWithDebug = (open: boolean, data?: unknown, title?: string) => {
    logEvent(open ? 'open-metadata-dialog' : 'close-metadata-dialog', { title })
    handleMetadataDialog(open, data, title)
  }

  // Log current state
  logCustom('DebugPage state', {
    logsCount: logs.length,
    loading,
    hasError: !!error,
    metadataDialogOpen: metadataDialog.open
  })

  if (loading) {
    logCustom('Showing loading state')
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
        logsCount={logs.length}
        error={error}
        onRefresh={handleRefreshWithDebug}
        onTestUIEvent={handleTestUIEventWithDebug}
        onCopyLogsAsJSON={handleCopyLogsAsJSONWithDebug}
        onCopyDebugInfo={handleCopyDebugInfoWithDebug}
        onClearLogs={handleClearLogsWithDebug}
      />
      
      <LogsDataGrid
        logs={logs}
        onViewMetadata={(data, title) => handleMetadataDialogWithDebug(true, data, title)}
      />

      <MetadataDialog
        open={metadataDialog.open}
        data={metadataDialog.data}
        title={metadataDialog.title}
        onClose={() => handleMetadataDialogWithDebug(false)}
      />
    </Box>
  );
};