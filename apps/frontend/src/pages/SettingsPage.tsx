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

export const SettingsPage = () => {
  const { settings, updateSettings, resetSettings } = useSettings();

  const handleDebugConsoleToggle = (enabled: boolean) => {
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

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Debug Console
        </Typography>
        
        <FormControlLabel
          control={
            <Switch 
              checked={settings.debugConsole}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDebugConsoleToggle(e.target.checked)}
            />
          }
          label="Show floating debug console"
        />
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
          Toggle the draggable debug console that appears on all pages. When disabled, debug messages 
          are still logged to the database but the floating console won't be visible.
        </Typography>

        <Divider sx={{ my: 2 }} />

        <FormControlLabel
          control={
            <Switch 
              checked={settings.autoRefresh}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAutoRefreshToggle(e.target.checked)}
            />
          }
          label="Auto-refresh debug logs"
        />
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Automatically refresh the database logs table every 30 seconds.
        </Typography>
      </Paper>

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
        Settings are saved to your browser's local storage and will persist across sessions.
      </Alert>
    </Box>
  );
};