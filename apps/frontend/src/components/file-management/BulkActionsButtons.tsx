import React from 'react';
import { Button, IconButton } from '@mui/material';
import {
  Assignment as AssignIcon,
  FolderOpen as MoveIcon,
  Delete as DeleteIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';

export const ProjectButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <Button
    size="small"
    startIcon={<AssignIcon />}
    onClick={onClick}
    sx={{ color: 'inherit', borderColor: 'currentColor' }}
    variant="outlined"
  >
    Assign to Project
  </Button>
);

export const FolderButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <Button
    size="small"
    startIcon={<MoveIcon />}
    onClick={onClick}
    sx={{ color: 'inherit', borderColor: 'currentColor' }}
    variant="outlined"
  >
    Move to Folder
  </Button>
);

export const DeleteButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <Button
    size="small"
    startIcon={<DeleteIcon />}
    onClick={onClick}
    sx={{ color: 'inherit', borderColor: 'currentColor' }}
    variant="outlined"
    color="error"
  >
    Delete
  </Button>
);

export const ClearButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <IconButton
    size="small"
    onClick={onClick}
    sx={{ color: 'inherit' }}
    title="Clear Selection"
  >
    <ClearIcon />
  </IconButton>
);