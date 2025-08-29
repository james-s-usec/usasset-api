import React from 'react';
import { IconButton } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import type { UserData } from '../types/user';

interface UserActionsProps {
  user: UserData;
  onEdit: (user: UserData) => void;
  onDelete: (user: UserData) => void;
}

export const UserActions = ({ 
  user, 
  onEdit, 
  onDelete 
}: UserActionsProps): React.ReactElement => {
  return (
    <>
      <IconButton
        size="small"
        onClick={() => onEdit(user)}
        color="primary"
      >
        <EditIcon />
      </IconButton>
      <IconButton
        size="small"
        onClick={() => onDelete(user)}
        color="error"
      >
        <DeleteIcon />
      </IconButton>
    </>
  );
};