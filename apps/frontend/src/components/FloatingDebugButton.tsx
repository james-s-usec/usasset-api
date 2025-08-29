/**
 * Floating Debug Button Component
 * Simple FAB button to open debug console
 */

import React from 'react';
import { Fab, Badge } from '@mui/material';
import { BugReport } from '@mui/icons-material';

interface FloatingDebugButtonProps {
  errorCount: number;
  onClick: () => void;
}

export function FloatingDebugButton({ errorCount, onClick }: FloatingDebugButtonProps): React.ReactElement {
  return (
    <Fab
      color="primary"
      size="medium"
      onClick={onClick}
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 1300
      }}
    >
      <Badge badgeContent={errorCount} color="error">
        <BugReport />
      </Badge>
    </Fab>
  );
}