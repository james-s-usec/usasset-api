/**
 * Floating Debug Actions Component
 * Action buttons for the debug console
 */

import React from 'react';
import { IconButton } from '@mui/material';
import { ContentCopy, Clear } from '@mui/icons-material';

interface FloatingDebugActionsProps {
  onCopy: () => void;
  onClear: () => void;
}

export function FloatingDebugActions({ onCopy, onClear }: FloatingDebugActionsProps): React.ReactElement {
  return (
    <>
      <IconButton size="small" onClick={onCopy}>
        <ContentCopy fontSize="small" />
      </IconButton>
      <IconButton size="small" onClick={onClear}>
        <Clear fontSize="small" />
      </IconButton>
    </>
  );
}