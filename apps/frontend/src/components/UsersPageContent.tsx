/**
 * Users Page Content Component
 * Handles the main content area of users page
 */

import React from 'react';
import { Box, Alert, CircularProgress } from '@mui/material';
import { UsersTable } from './UsersTable';
import type { UserData } from '../types/user';

interface UsersPageContentProps {
  users: UserData[];
  loading: boolean;
  error: string | null;
  onEdit: (user: UserData) => void;
  onDelete: (user: UserData) => void;
  onClearError: () => void;
}

export function UsersPageContent({
  users,
  loading,
  error,
  onEdit,
  onDelete,
  onClearError
}: UsersPageContentProps): React.ReactElement {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      {error && (
        <Alert severity="error" onClose={onClearError} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <UsersTable users={users} onEdit={onEdit} onDelete={onDelete} />
    </>
  );
}