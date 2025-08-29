/**
 * Floating Debug Messages Component
 * Displays debug messages with level-based coloring
 */

import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import type { DebugMessage } from './DebugConsole';

interface FloatingDebugMessagesProps {
  messages: DebugMessage[];
  maxMessages?: number;
}

export function FloatingDebugMessages({ 
  messages, 
  maxMessages = 5 
}: FloatingDebugMessagesProps): React.ReactElement {
  
  const recentMessages = messages.slice(0, maxMessages);
  
  const getLevelColor = (level: string): "default" | "error" | "warning" | "info" | "success" => {
    switch(level) {
      case 'error': return 'error';
      case 'warn': return 'warning';
      case 'info': return 'info';
      case 'debug': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ maxHeight: 300, overflowY: 'auto', p: 1 }}>
      {recentMessages.map((msg, idx) => (
        <Box key={idx} sx={{ mb: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Chip label={msg.level} size="small" color={getLevelColor(msg.level)} />
            <Typography variant="caption" color="text.secondary">
              {msg.category}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
            {msg.message}
          </Typography>
        </Box>
      ))}
      
      {messages.length > maxMessages && (
        <Typography variant="caption" color="text.secondary" sx={{ p: 1 }}>
          ...and {messages.length - maxMessages} more messages
        </Typography>
      )}
    </Box>
  );
}