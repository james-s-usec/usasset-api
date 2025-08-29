import React from 'react';
import { Table, TableBody, TableContainer, Paper } from '@mui/material';
import { UsersTableHeader } from './UsersTableHeader';
import { UsersTableRow } from './UsersTableRow';
import { UsersTableEmpty } from './UsersTableEmpty';
import type { UserData } from '../types/user';

interface UsersTableProps {
  users: UserData[];
  onEdit: (user: UserData) => void;
  onDelete: (user: UserData) => void;
}

export const UsersTable = ({
  users,
  onEdit,
  onDelete
}: UsersTableProps): React.ReactElement => {
  return (
    <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
      <Table>
        <UsersTableHeader />
        <TableBody>
          {users.length === 0 ? (
            <UsersTableEmpty />
          ) : (
            users.map((user) => (
              <UsersTableRow 
                key={user.id}
                user={user}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};