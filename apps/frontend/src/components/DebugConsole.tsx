import { useState } from 'react';
import { Box, Typography, Paper, IconButton, Chip } from '@mui/material';
import { Clear, ExpandMore, ExpandLess } from '@mui/icons-material';

export interface DebugMessage {
  id: string;
  level: 'info' | 'error' | 'warn' | 'debug';
  message: string;
  timestamp: Date;
  data?: unknown;
}

interface DebugConsoleProps {
  messages: DebugMessage[];
  onClear: () => void;
  maxHeight?: number;
}

export const DebugConsole = ({ messages, onClear, maxHeight = 200 }: DebugConsoleProps) => {
  const [expanded, setExpanded] = useState(true);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return '#d32f2f';
      case 'warn': return '#ed6c02';
      case 'info': return '#1976d2';
      case 'debug': return '#757575';
      default: return '#000';
    }
  };

  const getLevelBackground = (level: string) => {
    switch (level) {
      case 'error': return '#ffebee';
      case 'warn': return '#fff8e1';
      case 'info': return '#e3f2fd';
      case 'debug': return '#f5f5f5';
      default: return '#fff';
    }
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        mb: 2, 
        border: '1px solid #ddd',
        maxHeight: expanded ? maxHeight : 40,
        overflow: 'hidden',
        transition: 'max-height 0.3s ease'
      }}
    >
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 1,
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #ddd',
          cursor: 'pointer'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          Debug Console ({messages.length} messages)
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </Typography>
        <IconButton 
          size="small" 
          onClick={(e) => { e.stopPropagation(); onClear(); }}
          title="Clear console"
        >
          <Clear fontSize="small" />
        </IconButton>
      </Box>

      {expanded && (
        <Box sx={{ maxHeight: maxHeight - 40, overflowY: 'auto', p: 1 }}>
          {messages.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
              No debug messages
            </Typography>
          ) : (
            messages.map((msg) => (
              <Box 
                key={msg.id}
                sx={{ 
                  mb: 1, 
                  p: 1, 
                  backgroundColor: getLevelBackground(msg.level),
                  borderRadius: 1,
                  borderLeft: `4px solid ${getLevelColor(msg.level)}`
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Chip 
                    label={msg.level.toUpperCase()} 
                    size="small" 
                    sx={{ 
                      backgroundColor: getLevelColor(msg.level),
                      color: 'white',
                      fontSize: '10px',
                      height: 18
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {msg.timestamp.toLocaleTimeString()}
                  </Typography>
                </Box>
                
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    mb: msg.data ? 0.5 : 0
                  }}
                >
                  {msg.message}
                </Typography>

                {msg.data != null && (
                  <Box 
                    sx={{ 
                      backgroundColor: 'rgba(0,0,0,0.05)',
                      p: 0.5,
                      borderRadius: 0.5,
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      overflowX: 'auto'
                    }}
                  >
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(msg.data, null, 2)}
                    </pre>
                  </Box>
                )}
              </Box>
            ))
          )}
        </Box>
      )}
    </Paper>
  );
};