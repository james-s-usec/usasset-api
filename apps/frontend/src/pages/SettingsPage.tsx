import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Switch, 
  FormControlLabel, 
  Divider,
  Button,
  Alert
} from '@mui/material';
import { useSettings } from '../hooks/useSettings';

const DebugConsoleSection = ({ 
  debugConsole, 
  autoRefresh, 
  onDebugToggle, 
  onAutoRefreshToggle 
}: {
  debugConsole: boolean;
  autoRefresh: boolean;
  onDebugToggle: (enabled: boolean) => void;
  onAutoRefreshToggle: (enabled: boolean) => void;
}) => (
  <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
    <Typography variant="h6" gutterBottom>
      Debug Console
    </Typography>
    
    <FormControlLabel
      control={
        <Switch 
          checked={debugConsole}
          onChange={(e) => onDebugToggle(e.target.checked)}
        />
      }
      label="Show floating debug console"
    />
    
    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
      Toggle the draggable debug console that appears on all pages.
    </Typography>

    <Divider sx={{ my: 2 }} />

    <FormControlLabel
      control={
        <Switch 
          checked={autoRefresh}
          onChange={(e) => onAutoRefreshToggle(e.target.checked)}
        />
      }
      label="Auto-refresh debug logs"
    />
    
    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
      Automatically refresh the database logs table every 30 seconds.
    </Typography>
  </Paper>
);

const CurrentSettingsSection = ({ settings }: { settings: any }) => (
  <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
    <Typography variant="h6" gutterBottom>
      Current Settings
    </Typography>
    
    <Box sx={{ 
      backgroundColor: '#f5f5f5', 
      p: 2, 
      borderRadius: 1,
      fontFamily: 'monospace',
      fontSize: '12px'
    }}>
      {JSON.stringify(settings, null, 2)}
    </Box>
  </Paper>
);

export const SettingsPage = (): React.ReactElement => {
  const { settings, updateSettings, resetSettings } = useSettings();

  const handleDebugToggle = (enabled: boolean) => {
    updateSettings({ debugConsole: enabled });
  };

  const handleAutoRefreshToggle = (enabled: boolean) => {
    updateSettings({ autoRefresh: enabled });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <DebugConsoleSection
        debugConsole={settings.debugConsole}
        autoRefresh={settings.autoRefresh}
        onDebugToggle={handleDebugToggle}
        onAutoRefreshToggle={handleAutoRefreshToggle}
      />

      <CurrentSettingsSection settings={settings} />

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button 
          variant="outlined" 
          color="warning"
          onClick={resetSettings}
        >
          Reset to Defaults
        </Button>
      </Box>

      <Alert severity="info" sx={{ mt: 3 }}>
        Settings are saved to local storage.
      </Alert>
    </Box>
  );
};