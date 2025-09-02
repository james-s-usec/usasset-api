import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import type { Project } from '../types/project.types';

interface ProjectTableActionsProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onManageMembers: (project: Project) => void;
}

export const ProjectTableActions: React.FC<ProjectTableActionsProps> = ({
  project,
  onEdit,
  onDelete,
  onManageMembers,
}) => (
  <Box display="flex" gap={0.5}>
    <Tooltip title="Edit Project">
      <IconButton size="small" onClick={() => onEdit(project)}>
        <EditIcon />
      </IconButton>
    </Tooltip>
    <Tooltip title="Manage Members">
      <IconButton size="small" onClick={() => onManageMembers(project)}>
        <PeopleIcon />
      </IconButton>
    </Tooltip>
    <Tooltip title="Delete Project">
      <IconButton size="small" color="error" onClick={() => onDelete(project)}>
        <DeleteIcon />
      </IconButton>
    </Tooltip>
  </Box>
);