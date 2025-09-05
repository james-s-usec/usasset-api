import React from 'react';
import { Stack, IconButton, Tooltip } from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';

interface UsersHeaderActionsProps {
  onRefresh: () => void;
  onCreate: () => void;
}

export const UsersHeaderActions = ({ 
  onRefresh, 
  onCreate 
}: UsersHeaderActionsProps): React.ReactElement => (
  <Stack direction="row" spacing={1}>
    <Tooltip title="Refresh Users">
      <IconButton onClick={onRefresh} color="primary">
        <RefreshIcon />
      </IconButton>
    </Tooltip>
    <Tooltip title="Add New User">
      <IconButton
        onClick={onCreate}
        color="primary"
        sx={{ 
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
          '&:hover': { backgroundColor: 'primary.dark' }
        }}
      >
        <AddIcon />
      </IconButton>
    </Tooltip>
  </Stack>
);