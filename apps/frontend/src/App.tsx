import React from 'react'
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

const NavigationBar = (): React.ReactElement => {
  const navItems = [
    { label: 'Users', path: '/users' },
    { label: 'Debug', path: '/debug' },
    { label: 'Settings', path: '/settings' }
  ]
  
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          USAsset
        </Typography>
        {navItems.map(item => (
          <Button 
            key={item.path} 
            color="inherit" 
            component={RouterLink} 
            to={item.path}
          >
            {item.label}
          </Button>
        ))}
        <Box sx={{ ml: 2 }}><DbStatus /></Box>
      </Toolbar>
    </AppBar>
  )
}

const HomePage = (): React.ReactElement => {
  const navigate = useNavigate()
  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h3" gutterBottom>
        Welcome to USAsset
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
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
  )
}

const AppContent = (): React.ReactElement => {
  const { messages, clearMessages, copyAllDebugInfo, clearDatabaseLogs } = useDebug()
  const { settings } = useSettings()
  
  // Get build version from environment or use 'dev' as fallback
  const version = import.meta.env.VITE_APP_VERSION || 'dev'
  const buildTime = import.meta.env.VITE_BUILD_TIME || new Date().toISOString()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavigationBar />
      <Box sx={{ flexGrow: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/debug" element={<DebugPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Box>
      {settings.debugConsole && (
        <FloatingDebugConsole 
          messages={messages}
          onClear={clearMessages}
          onCopyAll={copyAllDebugInfo}
          onClearDatabase={clearDatabaseLogs}
        />
      )}
      {/* Version Footer - Always Visible */}
      <Box 
        component="footer" 
        sx={{ 
          backgroundColor: '#f5f5f5', 
          borderTop: '1px solid #ddd', 
          p: 1, 
          textAlign: 'center',
          fontSize: '0.875rem',
          color: '#666'
        }}
      >
        Version: {version} | Built: {buildTime}
      </Box>
    </Box>
  )
}

function App(): React.ReactElement {
  return (
    <SettingsProvider>
      <DebugProvider>
        <AppContent />
      </DebugProvider>
    </SettingsProvider>
  )
}

export default App
