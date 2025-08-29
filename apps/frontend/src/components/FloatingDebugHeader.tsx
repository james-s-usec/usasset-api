/**
 * Floating Debug Header Component
 * Header controls for the floating debug console
 */

import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { DragIndicator, Settings, ExpandMore, ExpandLess } from '@mui/icons-material';
import { FloatingDebugActions } from './FloatingDebugActions';

interface FloatingDebugHeaderProps {
  messageCount: number;
  showActions: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onToggleActions: () => void;
  onClear: () => void;
  onCopy: () => void;
  onClose: () => void;
}

export function FloatingDebugHeader(props: FloatingDebugHeaderProps): React.ReactElement {
  const { messageCount, showActions, onMouseDown, onToggleActions, onClear, onCopy, onClose } = props;
  
  return (
    <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', cursor: 'move' }}>
      <Box onMouseDown={onMouseDown} sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        <DragIndicator fontSize="small" sx={{ mr: 1 }} />
        <Typography variant="subtitle2">Debug Console ({messageCount})</Typography>
      </Box>
      <IconButton size="small" onClick={onToggleActions}>
        {showActions ? <ExpandLess /> : <ExpandMore />}
      </IconButton>
      {showActions && <FloatingDebugActions onCopy={onCopy} onClear={onClear} />}
      <IconButton size="small" onClick={onClose}>
        <Settings fontSize="small" />
      </IconButton>
    </Box>
  );
}