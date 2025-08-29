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

const DebugToggle = ({ 
  checked, 
  onChange, 
  label, 
  description 
}: { 
  checked: boolean; 
  onChange: (enabled: boolean) => void; 
  label: string; 
  description: string; 
}): React.ReactElement => {
  return (
    <div>
      <FormControlLabel
        control={<Switch checked={checked} onChange={(e) => onChange(e.target.checked)} />}
        label={label}
      />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
        {description}
      </Typography>
    </div>
  );
};

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
}): React.ReactElement => {
  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>Debug Console</Typography>
      
      <DebugToggle
        checked={debugConsole}
        onChange={onDebugToggle}
        label="Show floating debug console"
        description="Toggle the draggable debug console that appears on all pages."
      />

      <Divider sx={{ my: 2 }} />

      <DebugToggle
        checked={autoRefresh}
        onChange={onAutoRefreshToggle}
        label="Auto-refresh debug logs"
        description="Automatically refresh the database logs table every 30 seconds."
      />
    </Paper>
  );
};

const CurrentSettingsSection = ({ settings }: { settings: Record<string, unknown> }): React.ReactElement => {
  return (
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
};

const SettingsActions = ({ onReset }: { onReset: () => void }): React.ReactElement => {
  return (
    <div>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="outlined" color="warning" onClick={onReset}>
          Reset to Defaults
        </Button>
      </Box>
      <Alert severity="info" sx={{ mt: 3 }}>
        Settings are saved to local storage.
      </Alert>
    </div>
  );
};

export const SettingsPage = (): React.ReactElement => {
  const { settings, updateSettings, resetSettings } = useSettings();

  const handleDebugToggle = (enabled: boolean): void => {
    updateSettings({ debugConsole: enabled });
  };

  const handleAutoRefreshToggle = (enabled: boolean): void => {
    updateSettings({ autoRefresh: enabled });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Settings</Typography>

      <DebugConsoleSection
        debugConsole={settings.debugConsole}
        autoRefresh={settings.autoRefresh}
        onDebugToggle={handleDebugToggle}
        onAutoRefreshToggle={handleAutoRefreshToggle}
      />

      <CurrentSettingsSection settings={settings as unknown as Record<string, unknown>} />
      <SettingsActions onReset={resetSettings} />
    </Box>
  );
};