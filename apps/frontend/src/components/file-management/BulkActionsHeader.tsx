import React from 'react';
import {
  Box,
  Toolbar,
  Typography,
  IconButton,
  Button,
} from '@mui/material';
import {
  Close as CloseIcon,
  Assignment as AssignIcon,
  DriveFileMove as MoveIcon,
  Delete as DeleteIcon,
  SelectAll as SelectAllIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
} from '@mui/icons-material';

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
      <IconButton
        size="small"
        onClick={onSelectAll}
        sx={{ color: 'inherit' }}
        title={allSelected ? "Deselect All" : "Select All"}
      >
        {allSelected ? <CheckBoxIcon /> : someSelected ? <CheckBoxOutlineBlankIcon /> : <SelectAllIcon />}
      </IconButton>
      
      <Typography variant="subtitle1" sx={{ ml: 1 }}>
        {selectedCount} of {totalCount} selected
      </Typography>

      <Box sx={{ flexGrow: 1 }} />

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Button
          size="small"
          startIcon={<AssignIcon />}
          onClick={onProjectClick}
          sx={{ color: 'inherit', borderColor: 'currentColor' }}
          variant="outlined"
        >
          Assign to Project
        </Button>
        
        <Button
          size="small"
          startIcon={<MoveIcon />}
          onClick={onFolderClick}
          sx={{ color: 'inherit', borderColor: 'currentColor' }}
          variant="outlined"
        >
          Move to Folder
        </Button>
        
        <Button
          size="small"
          startIcon={<DeleteIcon />}
          onClick={onDeleteClick}
          sx={{ color: 'inherit', borderColor: 'currentColor' }}
          variant="outlined"
          color="error"
        >
          Delete
        </Button>
        
        <IconButton
          size="small"
          onClick={onClearSelection}
          sx={{ color: 'inherit' }}
          title="Clear Selection"
        >
          <CloseIcon />
        </IconButton>
      </Box>
    </Toolbar>
  </Box>
);