import { Routes, Route } from 'react-router-dom'
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { DbStatus } from './components/DbStatus'
import { UsersPage } from './pages/UsersPage'
import { DebugPage } from './pages/DebugPage'
import { SettingsPage } from './pages/SettingsPage'
import { DebugProvider } from './contexts/DebugContext'
import { SettingsProvider } from './contexts/SettingsContext'
import { useDebug } from './hooks/useDebugHook'
import { useSettings } from './hooks/useSettings'
import { FloatingDebugConsole } from './components/FloatingDebugConsole'

const AppContent = () => {
  const navigate = useNavigate()
  const { messages, clearMessages, copyAllDebugInfo, clearDatabaseLogs } = useDebug()
  const { settings } = useSettings()

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            USAsset
          </Typography>
          <Button 
            color="inherit" 
            component={RouterLink} 
            to="/users"
          >
            Users
          </Button>
          <Button 
            color="inherit" 
            component={RouterLink} 
            to="/debug"
          >
            Debug
          </Button>
          <Button 
            color="inherit" 
            component={RouterLink} 
            to="/settings"
          >
            Settings
          </Button>
          <Box sx={{ ml: 2 }}>
            <DbStatus />
          </Box>
        </Toolbar>
      </AppBar>

      <Routes>
        <Route path="/" element={
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h3" gutterBottom>
              Welcome to USAsset
            </Typography>
            <Typography variant="h6" color="text.secondary" paragraph>
              Asset management system
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/users')}
              sx={{ mt: 2 }}
            >
              View Users
            </Button>
          </Box>
        } />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/debug" element={<DebugPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>

      {/* Global Floating Debug Console - available on all pages when enabled */}
      {settings.debugConsole && (
        <FloatingDebugConsole 
          messages={messages}
          onClear={clearMessages}
          onCopyAll={copyAllDebugInfo}
          onClearDatabase={clearDatabaseLogs}
        />
      )}
    </Box>
  )
}

function App() {
  return (
    <SettingsProvider>
      <DebugProvider>
        <AppContent />
      </DebugProvider>
    </SettingsProvider>
  )
}

export default App
