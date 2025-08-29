import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useDebugPage } from '../hooks/useDebugPage';
import { useDebugComponent } from '../hooks/useDebugComponent';
import { DebugPageHeader } from '../components/DebugPageHeader';
import { LogsDataGrid } from '../components/LogsDataGrid';
import { MetadataDialog } from '../components/MetadataDialog';
import { createDebugPageHandlers, logDebugPageState } from '../utils/debug-page-helpers';

const LoadingState = (): React.ReactElement => {
  return (
    <Box 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      height="50vh"
    >
      <CircularProgress />
      <Typography sx={{ ml: 2 }}>Loading debug logs...</Typography>
    </Box>
  );
};

const DebugContent = ({ pageData, handlers }: { 
  pageData: ReturnType<typeof useDebugPage>; 
  handlers: ReturnType<typeof createDebugPageHandlers>; 
}): React.ReactElement => {
  return (
    <>
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
    </>
  );
};

const MainContent = ({ pageData, handlers }: { 
  pageData: ReturnType<typeof useDebugPage>; 
  handlers: ReturnType<typeof createDebugPageHandlers>; 
}): React.ReactElement => {
  return (
    <Box sx={{ p: 3 }}>
      <DebugContent pageData={pageData} handlers={handlers} />
    </Box>
  );
};

export const DebugPage = (): React.ReactElement => {
  const debug = useDebugComponent({
    name: 'DebugPage',
    trackRenders: true,
    trackPerformance: true
  });

  const pageData = useDebugPage();
  const handlers = createDebugPageHandlers(pageData, debug);
  
  logDebugPageState(debug, pageData);

  if (pageData.loading) {
    debug.logCustom('Showing loading state');
    return <LoadingState />;
  }

  return <MainContent pageData={pageData} handlers={handlers} />;
};