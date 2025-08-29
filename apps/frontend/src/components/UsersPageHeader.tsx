import React from 'react';
import { Box } from '@mui/material';
import { UsersHeaderTitle } from './UsersHeaderTitle';
import { UsersHeaderActions } from './UsersHeaderActions';

interface UsersPageHeaderProps {
  onAdd: () => void;
}

export const UsersPageHeader = ({
  onAdd
}: UsersPageHeaderProps): React.ReactElement => {
  return (
    <Box 
      display="flex" 
      flexDirection={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between" 
      alignItems={{ xs: 'stretch', sm: 'center' }}
      gap={2}
      mb={3}
    >
      <UsersHeaderTitle />
      <UsersHeaderActions 
        onRefresh={() => {}}
        onCreate={onAdd}
      />
    </Box>
  );
};