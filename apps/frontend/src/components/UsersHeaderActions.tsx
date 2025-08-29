import React from 'react';
import { Button, Stack } from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';

interface UsersHeaderActionsProps {
  onRefresh: () => void;
  onCreate: () => void;
}

export const UsersHeaderActions = ({ 
  onRefresh, 
  onCreate 
}: UsersHeaderActionsProps): React.ReactElement => {
  return (
    <Stack 
      direction={{ xs: 'column', sm: 'row' }} 
      spacing={2}
      sx={{ width: { xs: '100%', sm: 'auto' } }}
    >
      <Button
        variant="outlined"
        startIcon={<RefreshIcon />}
        onClick={onRefresh}
      >
        Refresh
      </Button>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onCreate}
      >
        Add User
      </Button>
    </Stack>
  );
};