/**
 * Floating Debug Console Component
 * Simplified composition of debug UI following CLAUDE.md principles
 */

import React, { useState } from 'react';
import { Paper } from '@mui/material';
import { FloatingDebugButton } from './FloatingDebugButton';
import { FloatingDebugHeader } from './FloatingDebugHeader';
import { FloatingDebugMessages } from './FloatingDebugMessages';
import { useFloatingPosition } from '../hooks/useFloatingPosition';
import { copyDebugInfo } from '../utils/debug-clipboard';
import type { DebugMessage } from './DebugConsole';

interface FloatingDebugConsoleProps {
  messages: DebugMessage[];
  onClear: () => void;
  onCopyAll?: () => void;
  onClearDatabase?: () => Promise<{ message: string; deletedCount: number }>;
}

export function FloatingDebugConsole({ 
  messages, 
  onClear, 
  onCopyAll 
}: FloatingDebugConsoleProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const { position, isDragging, handleMouseDown, consoleRef } = useFloatingPosition();
  const errorCount = messages.filter(m => m.level === 'error').length;

  if (!isOpen) {
    return <FloatingDebugButton errorCount={errorCount} onClick={() => setIsOpen(true)} />;
  }

  return (
    <Paper ref={consoleRef} elevation={8} sx={{
      position: 'fixed', left: position.x, top: position.y,
      width: 400, maxHeight: 500, zIndex: 1400,
      opacity: isDragging ? 0.8 : 1,
      transition: isDragging ? 'none' : 'opacity 0.2s'
    }}>
      <FloatingDebugHeader
        messageCount={messages.length}
        showActions={showActions}
        onMouseDown={handleMouseDown}
        onToggleActions={() => setShowActions(!showActions)}
        onClear={onClear}
        onCopy={() => onCopyAll ? onCopyAll() : copyDebugInfo(messages, errorCount)}
        onClose={() => setIsOpen(false)}
      />
      <FloatingDebugMessages messages={messages} />
    </Paper>
  );
}