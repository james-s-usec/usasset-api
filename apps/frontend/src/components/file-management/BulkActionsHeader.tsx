import React from 'react';
import {
  Box,
  Toolbar,
  Typography,
  IconButton,
} from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
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

// Styling for the sticky header container
const getHeaderContainerStyles = (): SxProps<Theme> => ({
  position: 'sticky',
  top: 0,
  zIndex: 10,
  bgcolor: 'primary.main',
  color: 'primary.contrastText',
  borderRadius: 1,
  mb: 1,
});

// Props interface for HeaderToolbar to reduce inline type definition
interface HeaderToolbarProps {
  allSelected: boolean;
  someSelected: boolean;
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onProjectClick: () => void;
  onFolderClick: () => void;
  onDeleteClick: () => void;
}

// Main toolbar content with selection controls and actions
const HeaderToolbar: React.FC<HeaderToolbarProps> = (props) => (
  <Toolbar variant="dense" sx={{ minHeight: 48 }}>
    <SelectionToggleButton
      allSelected={props.allSelected}
      someSelected={props.someSelected}
      onSelectAll={props.onSelectAll}
    />
    <SelectionCounter 
      selectedCount={props.selectedCount} 
      totalCount={props.totalCount} 
    />
    <Box sx={{ flexGrow: 1 }} />
    <ActionButtons
      onProjectClick={props.onProjectClick}
      onFolderClick={props.onFolderClick}
      onDeleteClick={props.onDeleteClick}
      onClearSelection={props.onClearSelection}
    />
  </Toolbar>
);

// Main component - now just handles composition
export const BulkActionsHeader: React.FC<BulkActionsHeaderProps> = (props) => (
  <Box sx={getHeaderContainerStyles()}>
    <HeaderToolbar {...props} />
  </Box>
);