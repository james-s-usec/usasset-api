import React from 'react';
import { TableHead, TableRow, TableCell } from '@mui/material';

export const ProjectsTableHeader: React.FC = () => (
  <TableHead>
    <TableRow>
      <TableCell>Name</TableCell>
      <TableCell>Description</TableCell>
      <TableCell>Status</TableCell>
      <TableCell>Owner</TableCell>
      <TableCell>Actions</TableCell>
    </TableRow>
  </TableHead>
);