import React from 'react';
import { Chip } from '@mui/material';
import { USER_ROLES } from '../types/user';
import { getRoleColor } from '../utils/user-utils';
import type { UserRole } from '../types/user';

interface UserRoleChipProps {
  role: UserRole;
}

export const UserRoleChip = ({ role }: UserRoleChipProps): React.ReactElement => {
  return (
    <Chip
      label={role || USER_ROLES.USER}
      color={getRoleColor(role)}
      size="small"
    />
  );
};