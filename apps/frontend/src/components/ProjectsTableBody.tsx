import React from 'react';
import { TableBody } from '@mui/material';
import type { Project } from '../types/project.types';
import { ProjectTableRow } from './ProjectTableRow';

interface ProjectsTableBodyProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onManageMembers: (project: Project) => void;
}

export const ProjectsTableBody: React.FC<ProjectsTableBodyProps> = ({
  projects,
  onEdit,
  onDelete,
  onManageMembers,
}) => (
  <TableBody>
    {projects.map((project) => (
      <ProjectTableRow
        key={project.id}
        project={project}
        onEdit={onEdit}
        onDelete={onDelete}
        onManageMembers={onManageMembers}
      />
    ))}
  </TableBody>
);