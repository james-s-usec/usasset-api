import React from 'react';
import { TableRow, TableCell } from '@mui/material';
import { UserRoleChip } from './UserRoleChip';
import { UserActions } from './UserActions';
import { formatDate } from '../utils/user-utils';
import type { UserData } from '../types/user';

interface UsersTableRowProps {
  user: UserData;
  onEdit: (user: UserData) => void;
  onDelete: (user: UserData) => void;
}

export const UsersTableRow = ({ 
  user, 
  onEdit, 
  onDelete 
}: UsersTableRowProps): React.ReactElement => {
  return (
    <TableRow key={user.id}>
      <TableCell>{user.name || '—'}</TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>
        <UserRoleChip role={user.role || 'USER'} />
      </TableCell>
      <TableCell>{formatDate(user.created_at)}</TableCell>
      <TableCell>
        <UserActions 
          user={user}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  );
};