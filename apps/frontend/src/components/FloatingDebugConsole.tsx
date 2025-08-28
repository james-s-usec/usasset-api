import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Paper, IconButton, Chip, Fab, Button } from '@mui/material';
import { BugReport, Clear, ExpandMore, ExpandLess, DragIndicator, ContentCopy, Settings } from '@mui/icons-material';
import type { DebugMessage } from './DebugConsole';

interface FloatingDebugConsoleProps {
  messages: DebugMessage[];
  onClear: () => void;
  onCopyAll?: () => void;
  onClearDatabase?: () => Promise<void>;
}

export const FloatingDebugConsole = ({ messages, onClear, onCopyAll, onClearDatabase }: FloatingDebugConsoleProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showActions, setShowActions] = useState(false);
  const consoleRef = useRef<HTMLDivElement>(null);

  const recentMessages = messages.slice(0, 5); // Show only last 5 messages
  const errorCount = messages.filter(m => m.level === 'error').length;

  const handleCopyMessages = () => {
    try {
      const debugInfo = {
        timestamp: new Date().toISOString(),
        recentMessages: recentMessages,
        totalMessages: messages.length,
        errorCount,
        url: window.location.href,
        userAgent: navigator.userAgent
      };
      
      navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
      alert('Debug messages copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = consoleRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: Math.max(0, Math.min(window.innerWidth - 320, e.clientX - dragOffset.x)),
          y: Math.max(0, Math.min(window.innerHeight - 200, e.clientY - dragOffset.y))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return '#d32f2f';
      case 'warn': return '#ed6c02';
      case 'info': return '#1976d2';
      case 'debug': return '#757575';
      default: return '#000';
    }
  };

  if (!isOpen) {
    return (
      <Fab
        color={errorCount > 0 ? 'error' : 'primary'}
        size="medium"
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
          '&:hover': { transform: 'scale(1.1)' }
        }}
        onClick={() => setIsOpen(true)}
      >
        <BugReport />
        {messages.length > 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              backgroundColor: errorCount > 0 ? '#d32f2f' : '#1976d2',
              color: 'white',
              borderRadius: '50%',
              width: 20,
              height: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 'bold'
            }}
          >
            {messages.length > 99 ? '99+' : messages.length}
          </Box>
        )}
      </Fab>
    );
  }

  return (
    <Paper
      ref={consoleRef}
      elevation={8}
      sx={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: 320,
        maxHeight: 400,
        zIndex: 1001,
        border: '2px solid #1976d2',
        borderRadius: 2,
        overflow: 'hidden',
        userSelect: isDragging ? 'none' : 'auto',
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 1,
          backgroundColor: errorCount > 0 ? '#ffebee' : '#e3f2fd',
          borderBottom: '1px solid #ddd',
          cursor: 'grab',
          '&:active': { cursor: 'grabbing' }
        }}
        onMouseDown={handleMouseDown}
      >
        <DragIndicator sx={{ mr: 1, color: 'text.secondary' }} />
        <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
          Debug Console ({messages.length})
          {errorCount > 0 && (
            <Chip
              label={`${errorCount} errors`}
              size="small"
              color="error"
              sx={{ ml: 1, height: 16, fontSize: '10px' }}
            />
          )}
        </Typography>
        <IconButton size="small" onClick={handleCopyMessages} title="Copy messages">
          <ContentCopy fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={() => setShowActions(!showActions)} title="Toggle actions">
          {showActions ? <ExpandMore fontSize="small" /> : <Settings fontSize="small" />}
        </IconButton>
        <IconButton size="small" onClick={onClear} title="Clear console">
          <Clear fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={() => setIsOpen(false)} title="Close console">
          <ExpandLess fontSize="small" />
        </IconButton>
      </Box>

      {/* Actions Panel */}
      {showActions && (
        <Box sx={{ p: 1, borderBottom: '1px solid #ddd', backgroundColor: '#f9f9f9' }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button 
              size="small" 
              variant="outlined" 
              onClick={handleCopyMessages}
              startIcon={<ContentCopy />}
            >
              Copy Recent
            </Button>
            {onCopyAll && (
              <Button 
                size="small" 
                variant="outlined" 
                color="secondary"
                onClick={onCopyAll}
              >
                Copy All
              </Button>
            )}
            <Button 
              size="small" 
              variant="outlined" 
              color="warning"
              onClick={onClear}
            >
              Clear Console
            </Button>
            {onClearDatabase && (
              <Button 
                size="small" 
                variant="outlined" 
                color="error"
                onClick={async () => {
                  if (window.confirm('⚠️ Clear ALL database logs?\n\nThis will delete EVERY log from the entire database (not just the 50 visible).\n\nThis action CANNOT be undone.')) {
                    try {
                      await onClearDatabase();
                    } catch (error) {
                      console.error('Failed to clear database logs:', error);
                    }
                  }
                }}
              >
                Clear DB Logs
              </Button>
            )}
          </Box>
        </Box>
      )}

      {/* Messages */}
      <Box sx={{ maxHeight: 300, overflowY: 'auto', p: 1 }}>
        {recentMessages.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
            No debug messages
          </Typography>
        ) : (
          recentMessages.map((msg) => (
            <Box
              key={msg.id}
              sx={{
                mb: 1,
                p: 0.5,
                backgroundColor: msg.level === 'error' ? '#ffebee' : 
                                msg.level === 'warn' ? '#fff8e1' : 
                                msg.level === 'info' ? '#e3f2fd' : '#f5f5f5',
                borderRadius: 1,
                borderLeft: `3px solid ${getLevelColor(msg.level)}`
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <Chip
                  label={msg.level.toUpperCase()}
                  size="small"
                  sx={{
                    backgroundColor: getLevelColor(msg.level),
                    color: 'white',
                    fontSize: '8px',
                    height: 14,
                    '& .MuiChip-label': { px: 0.5 }
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '9px' }}>
                  {msg.timestamp.toLocaleTimeString()}
                </Typography>
              </Box>

              <Typography
                variant="body2"
                sx={{
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  wordBreak: 'break-word'
                }}
              >
                {msg.message}
              </Typography>

              {msg.data != null && (
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    fontSize: '9px',
                    color: 'text.secondary',
                    mt: 0.5
                  }}
                >
                  {typeof msg.data === 'object' && msg.data !== null 
                    ? JSON.stringify(msg.data).slice(0, 50) + '...' 
                    : String(msg.data)}
                </Typography>
              )}
            </Box>
          ))
        )}

        {messages.length > 5 && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', textAlign: 'center', mt: 1 }}
          >
            +{messages.length - 5} more messages (see Debug page)
          </Typography>
        )}
      </Box>
    </Paper>
  );
};