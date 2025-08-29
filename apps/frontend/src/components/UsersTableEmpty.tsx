import React from 'react';
import { TableRow, TableCell } from '@mui/material';

export const UsersTableEmpty = (): React.ReactElement => {
  return (
    <TableRow>
      <TableCell colSpan={5} align="center">
        No users found
      </TableCell>
    </TableRow>
  );
};