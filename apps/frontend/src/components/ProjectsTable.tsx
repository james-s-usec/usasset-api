import React from 'react';
import {
  Table,
  TableContainer,
  Paper,
} from '@mui/material';
import type { Project } from '../types/project.types';
import { ProjectsTableHeader } from './ProjectsTableHeader';
import { ProjectsTableBody } from './ProjectsTableBody';
import { ProjectsTablePagination } from './ProjectsTablePagination';

interface ProjectsTableProps {
  projects: Project[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onManageMembers: (project: Project) => void;
}

export const ProjectsTable: React.FC<ProjectsTableProps> = ({
  projects,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onManageMembers,
}) => (
  <TableContainer component={Paper}>
    <Table>
      <ProjectsTableHeader />
      <ProjectsTableBody
        projects={projects}
        onEdit={onEdit}
        onDelete={onDelete}
        onManageMembers={onManageMembers}
      />
    </Table>
    <ProjectsTablePagination
      total={total}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
    />
  </TableContainer>
);