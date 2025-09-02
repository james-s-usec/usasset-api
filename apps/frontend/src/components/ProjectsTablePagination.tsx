import React from 'react';
import { TablePagination } from '@mui/material';

interface ProjectsTablePaginationProps {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export const ProjectsTablePagination: React.FC<ProjectsTablePaginationProps> = ({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) => (
  <TablePagination
    component="div"
    count={total}
    page={page - 1}
    onPageChange={(_, newPage) => onPageChange(newPage + 1)}
    rowsPerPage={pageSize}
    onRowsPerPageChange={(e) => onPageSizeChange(parseInt(e.target.value))}
    rowsPerPageOptions={[5, 10, 25, 50]}
  />
);