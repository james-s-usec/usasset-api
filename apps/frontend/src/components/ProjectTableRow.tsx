import React from 'react';
import { TableRow, TableCell } from '@mui/material';
import type { Project } from '../types/project.types';
import { ProjectStatusChip } from './ProjectStatusChip';
import { ProjectTableActions } from './ProjectTableActions';

interface ProjectTableRowProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onManageMembers: (project: Project) => void;
}

export const ProjectTableRow: React.FC<ProjectTableRowProps> = ({
  project,
  onEdit,
  onDelete,
  onManageMembers,
}) => (
  <TableRow>
    <TableCell>{project.name}</TableCell>
    <TableCell>{project.description || '-'}</TableCell>
    <TableCell>
      <ProjectStatusChip status={project.status} />
    </TableCell>
    <TableCell>{project.owner_id}</TableCell>
    <TableCell>
      <ProjectTableActions
        project={project}
        onEdit={onEdit}
        onDelete={onDelete}
        onManageMembers={onManageMembers}
      />
    </TableCell>
  </TableRow>
);