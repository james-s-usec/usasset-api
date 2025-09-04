import React from 'react';
import { Box, Toolbar } from '@mui/material';
import { SelectionInfo, BulkActionButtons } from './BulkActionsToolbar.components';

interface SelectionProps {
  allSelected: boolean;
  someSelected: boolean;
  selectedCount: number;
  selectedFileNames: string[];
  remainingCount: number;
  onToggleSelect: () => void;
}

interface ActionProps {
  onProjectClick: () => void;
  onFolderClick: () => void;
  onDeleteClick: () => void;
  onClear: () => void;
}

interface BulkActionsContentProps extends SelectionProps, ActionProps {}

// Container styles extracted
const containerStyles = {
  bgcolor: 'primary.light',
  color: 'primary.contrastText',
  mb: 2,
  borderRadius: 1
};

// Component now under 30 lines
export const BulkActionsContent: React.FC<BulkActionsContentProps> = (props) => {
  const { onProjectClick, onFolderClick, onDeleteClick, onClear, ...selectionProps } = props;
  const actionProps = { onProjectClick, onFolderClick, onDeleteClick, onClear };
  
  return (
    <Box sx={containerStyles}>
      <Toolbar sx={{ minHeight: '48px !important' }}>
        <SelectionInfo {...selectionProps} />
        <BulkActionButtons {...actionProps} />
      </Toolbar>
    </Box>
  );
};