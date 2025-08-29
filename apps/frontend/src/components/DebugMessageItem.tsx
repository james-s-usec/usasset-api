/**
 * Debug Message Item Component
 * Single debug message display
 */

import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { getLevelColor } from '../utils/debug-level-colors';
import type { DebugMessage } from './DebugConsole';

interface DebugMessageItemProps {
  message: DebugMessage;
}

export function DebugMessageItem({ message }: DebugMessageItemProps): React.ReactElement {
  return (
    <Box sx={{ mb: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Chip label={message.level} size="small" color={getLevelColor(message.level)} />
        <Typography variant="caption" color="text.secondary">
          {message.category}
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
        {message.message}
      </Typography>
    </Box>
  );
}