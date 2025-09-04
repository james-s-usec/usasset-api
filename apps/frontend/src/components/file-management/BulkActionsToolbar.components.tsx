import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Chip,
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

// Sub-component for selection icon
const SelectionIcon: React.FC<{ 
  allSelected: boolean; 
  someSelected: boolean;
}> = ({ allSelected, someSelected }) => {
  if (allSelected) return <CheckBoxIcon />;
  if (someSelected) return <CheckBoxOutlineBlankIcon />;
  return <SelectAllIcon />;
};

// Sub-component for file name chips display
const FileNameChips: React.FC<{ 
  fileNames: string[]; 
  remainingCount: number;
}> = ({ fileNames, remainingCount }) => (
  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
    {fileNames.map((name) => (
      <Chip
        key={name}
        label={name}
        size="small"
        sx={{ 
          height: 20, 
          fontSize: '0.7rem',
          bgcolor: 'rgba(255,255,255,0.2)',
          color: 'inherit'
        }}
      />
    ))}
    {remainingCount > 0 && (
      <Chip
        label={`+${remainingCount} more`}
        size="small"
        sx={{ 
          height: 20, 
          fontSize: '0.7rem',
          bgcolor: 'rgba(255,255,255,0.2)',
          color: 'inherit'
        }}
      />
    )}
  </Box>
);

// Sub-component for selection info section
export const SelectionInfo: React.FC<{
  allSelected: boolean;
  someSelected: boolean;
  selectedCount: number;
  selectedFileNames: string[];
  remainingCount: number;
  onToggleSelect: () => void;
}> = ({ 
  allSelected, 
  someSelected, 
  selectedCount, 
  selectedFileNames, 
  remainingCount,
  onToggleSelect 
}) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
    <IconButton
      size="small"
      onClick={onToggleSelect}
      sx={{ color: 'inherit' }}
      title={allSelected ? 'Deselect All' : 'Select All'}
    >
      <SelectionIcon allSelected={allSelected} someSelected={someSelected} />
    </IconButton>
    
    <Typography variant="body2" fontWeight="medium">
      {selectedCount} file{selectedCount !== 1 ? 's' : ''} selected
    </Typography>
    
    {selectedFileNames.length > 0 && (
      <FileNameChips 
        fileNames={selectedFileNames} 
        remainingCount={remainingCount} 
      />
    )}
  </Box>
);

// Single action button component
const ActionButton: React.FC<{
  icon: React.ReactElement;
  label: string;
  onClick: () => void;
  color?: 'inherit' | 'error';
}> = ({ icon, label, onClick, color = 'inherit' }) => (
  <Button
    size="small"
    startIcon={icon}
    onClick={onClick}
    sx={{ color: 'inherit', borderColor: 'currentColor' }}
    variant="outlined"
    color={color as 'inherit' | 'error' | undefined}
  >
    {label}
  </Button>
);

// Sub-component for bulk action buttons
export const BulkActionButtons: React.FC<{
  onProjectClick: () => void;
  onFolderClick: () => void;
  onDeleteClick: () => void;
  onClear: () => void;
}> = ({ onProjectClick, onFolderClick, onDeleteClick, onClear }) => (
  <Box sx={{ display: 'flex', gap: 1 }}>
    <ActionButton 
      icon={<AssignIcon />} 
      label="Assign Project" 
      onClick={onProjectClick} 
    />
    <ActionButton 
      icon={<MoveIcon />} 
      label="Move to Folder" 
      onClick={onFolderClick} 
    />
    <ActionButton 
      icon={<DeleteIcon />} 
      label="Delete" 
      onClick={onDeleteClick} 
      color="error" 
    />
    <IconButton
      size="small"
      onClick={onClear}
      sx={{ color: 'inherit' }}
      title="Clear Selection"
    >
      <CloseIcon />
    </IconButton>
  </Box>
);