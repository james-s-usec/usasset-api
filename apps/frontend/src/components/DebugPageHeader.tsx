import { Box, Typography, Button, Alert } from '@mui/material';

export interface DebugPageHeaderProps {
  logsCount: number;
  error: string | null;
  onRefresh: () => Promise<void>;
  onTestUIEvent: () => void;
  onCopyLogsAsJSON: () => void;
  onCopyDebugInfo: () => void;
  onClearLogs: () => Promise<void>;
}

export const DebugPageHeader = ({
  logsCount,
  error,
  onRefresh,
  onTestUIEvent,
  onCopyLogsAsJSON,
  onCopyDebugInfo,
  onClearLogs,
}: DebugPageHeaderProps) => {
  return (
    <>
      <Typography variant="h4" gutterBottom>
        Database Logs ({logsCount} entries)
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Use the floating debug console (bottom-right) for real-time debug messages. This table shows persistent database logs.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button variant="contained" onClick={onRefresh}>
          Refresh Logs
        </Button>
        <Button variant="outlined" onClick={onTestUIEvent}>
          Test UI Event
        </Button>
        <Button variant="outlined" onClick={onCopyLogsAsJSON}>
          Copy DB Logs
        </Button>
        <Button variant="outlined" color="secondary" onClick={onCopyDebugInfo}>
          Copy All Debug Info
        </Button>
        <Button variant="outlined" color="warning" onClick={onClearLogs}>
          Clear Logs
        </Button>
      </Box>
    </>
  );
};