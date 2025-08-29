import React from 'react';
import { TableHead, TableRow, TableCell } from '@mui/material';

export const UsersTableHeader = (): React.ReactElement => {
  return (
    <TableHead>
      <TableRow>
        <TableCell>Name</TableCell>
        <TableCell>Email</TableCell>
        <TableCell>Role</TableCell>
        <TableCell>Created</TableCell>
        <TableCell>Actions</TableCell>
      </TableRow>
    </TableHead>
  );
};