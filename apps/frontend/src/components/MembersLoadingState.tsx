import React from 'react';
import {
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';

interface MembersLoadingStateProps {
  loading: boolean;
  error: string | null;
  hasMembers: boolean;
}

export const MembersLoadingState: React.FC<MembersLoadingStateProps> = ({
  loading,
  error,
  hasMembers,
}) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!hasMembers) {
    return (
      <Typography variant="body2" color="textSecondary" sx={{ p: 2 }}>
        No members added yet.
      </Typography>
    );
  }

  return null;
};