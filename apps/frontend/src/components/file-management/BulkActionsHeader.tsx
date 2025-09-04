import React from 'react';
import {
  Box,
  Toolbar,
  Typography,
  IconButton,
} from '@mui/material';
import {
  SelectAll as SelectAllIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
} from '@mui/icons-material';
import { ProjectButton, FolderButton, DeleteButton, ClearButton } from './BulkActionsButtons';

interface BulkActionsHeaderProps {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  someSelected: boolean;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onProjectClick: () => void;
  onFolderClick: () => void;
  onDeleteClick: () => void;
}

const SelectionToggleButton: React.FC<{
  allSelected: boolean;
  someSelected: boolean;
  onSelectAll: () => void;
}> = ({ allSelected, someSelected, onSelectAll }) => (
  <IconButton
    size="small"
    onClick={onSelectAll}
    sx={{ color: 'inherit' }}
    title={allSelected ? "Deselect All" : "Select All"}
  >
    {allSelected ? <CheckBoxIcon /> : someSelected ? <CheckBoxOutlineBlankIcon /> : <SelectAllIcon />}
  </IconButton>
);

const SelectionCounter: React.FC<{
  selectedCount: number;
  totalCount: number;
}> = ({ selectedCount, totalCount }) => (
  <Typography variant="subtitle1" sx={{ ml: 1 }}>
    {selectedCount} of {totalCount} selected
  </Typography>
);

const ActionButtons: React.FC<{
  onProjectClick: () => void;
  onFolderClick: () => void;
  onDeleteClick: () => void;
  onClearSelection: () => void;
}> = ({ onProjectClick, onFolderClick, onDeleteClick, onClearSelection }) => (
  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
    <ProjectButton onClick={onProjectClick} />
    <FolderButton onClick={onFolderClick} />
    <DeleteButton onClick={onDeleteClick} />
    <ClearButton onClick={onClearSelection} />
  </Box>
);

export const BulkActionsHeader: React.FC<BulkActionsHeaderProps> = ({
  selectedCount,
  totalCount,
  allSelected,
  someSelected,
  onSelectAll,
  onClearSelection,
  onProjectClick,
  onFolderClick,
  onDeleteClick,
}) => (
  <Box sx={{ 
    position: 'sticky', 
    top: 0, 
    zIndex: 10, 
    bgcolor: 'primary.main',
    color: 'primary.contrastText',
    borderRadius: 1,
    mb: 1,
  }}>
    <Toolbar variant="dense" sx={{ minHeight: 48 }}>
      <SelectionToggleButton
        allSelected={allSelected}
        someSelected={someSelected}
        onSelectAll={onSelectAll}
      />
      <SelectionCounter selectedCount={selectedCount} totalCount={totalCount} />
      <Box sx={{ flexGrow: 1 }} />
      <ActionButtons
        onProjectClick={onProjectClick}
        onFolderClick={onFolderClick}
        onDeleteClick={onDeleteClick}
        onClearSelection={onClearSelection}
      />
    </Toolbar>
  </Box>
);