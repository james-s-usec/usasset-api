/**
 * Floating Debug Messages Component
 * Displays debug messages with level-based coloring
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import { DebugMessageItem } from './DebugMessageItem';
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

  return (
    <Box sx={{ maxHeight: 300, overflowY: 'auto', p: 1 }}>
      {recentMessages.map((msg, idx) => (
        <DebugMessageItem key={idx} message={msg} />
      ))}
      
      {messages.length > maxMessages && (
        <Typography variant="caption" color="text.secondary" sx={{ p: 1 }}>
          ...and {messages.length - maxMessages} more messages
        </Typography>
      )}
    </Box>
  );
}