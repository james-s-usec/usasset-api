import React from 'react';
import { Chip } from '@mui/material';
import { ProjectStatus } from '../types/project.types';

interface ProjectStatusChipProps {
  status: ProjectStatus;
}

const getStatusColor = (status: ProjectStatus): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'DRAFT':
      return 'default';
    case 'ON_HOLD':
      return 'warning';
    case 'COMPLETED':
      return 'info';
    case 'CANCELLED':
      return 'error';
    default:
      return 'default';
  }
};

const getStatusLabel = (status: ProjectStatus): string => {
  switch (status) {
    case 'ACTIVE':
      return 'Active';
    case 'DRAFT':
      return 'Draft';
    case 'ON_HOLD':
      return 'On Hold';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status;
  }
};

export const ProjectStatusChip: React.FC<ProjectStatusChipProps> = ({ status }) => (
  <Chip
    label={getStatusLabel(status)}
    color={getStatusColor(status)}
    size="small"
  />
);