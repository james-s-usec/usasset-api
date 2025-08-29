import React from 'react';
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

interface ButtonConfig {
  label: string;
  onClick: () => void | Promise<void>;
  variant?: 'contained' | 'outlined';
  color?: 'primary' | 'secondary' | 'warning';
}

const DebugButtons = ({ buttons }: { buttons: ButtonConfig[] }): React.ReactElement => (
  <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
    {buttons.map((btn) => (
      <Button 
        key={btn.label}
        variant={btn.variant || 'outlined'} 
        color={btn.color || 'primary'}
        onClick={btn.onClick}
      >
        {btn.label}
      </Button>
    ))}
  </Box>
);

const HeaderText = ({ logsCount }: { logsCount: number }): React.ReactElement => (
  <>
    <Typography variant="h4" gutterBottom>
      Database Logs ({logsCount} entries)
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
      Use the floating debug console (bottom-right) for real-time debug messages. This table shows persistent database logs.
    </Typography>
  </>
);

export const DebugPageHeader = (props: DebugPageHeaderProps): React.ReactElement => {
  const buttons: ButtonConfig[] = [
    { label: 'Refresh Logs', onClick: props.onRefresh, variant: 'contained' },
    { label: 'Test UI Event', onClick: props.onTestUIEvent },
    { label: 'Copy DB Logs', onClick: props.onCopyLogsAsJSON },
    { label: 'Copy All Debug Info', onClick: props.onCopyDebugInfo, color: 'secondary' },
    { label: 'Clear Logs', onClick: props.onClearLogs, color: 'warning' },
  ];

  return (
    <>
      <HeaderText logsCount={props.logsCount} />
      {props.error && <Alert severity="error" sx={{ mb: 2 }}>{props.error}</Alert>}
      <DebugButtons buttons={buttons} />
    </>
  );
};