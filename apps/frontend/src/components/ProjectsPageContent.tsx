import React from 'react';
import { Box, Alert, CircularProgress } from '@mui/material';
import { ProjectsTable } from './ProjectsTable';
import type { Project } from '../types/project.types';

interface ProjectsPageContentProps {
  loading: boolean;
  error: string | null;
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

/**
 * Error state component - displays error message
 * Single responsibility: render error alert
 */
const ErrorState: React.FC<{ error: string }> = ({ error }) => (
  <Alert severity="error" sx={{ mb: 2 }}>
    {error}
  </Alert>
);

/**
 * Loading state component - displays spinner
 * Single responsibility: render loading indicator
 */
const LoadingState: React.FC = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
    <CircularProgress />
  </Box>
);

/**
 * Content component for the Projects page
 * Single responsibility: orchestrate state rendering
 * Max 30 lines per function rule satisfied
 */
export const ProjectsPageContent: React.FC<ProjectsPageContentProps> = ({
  loading, error, projects, total, page, pageSize,
  onPageChange, onPageSizeChange, onEdit, onDelete, onManageMembers,
}) => {
  if (error) {
    return <ErrorState error={error} />;
  }

  if (loading && projects.length === 0) {
    return <LoadingState />;
  }

  return (
    <ProjectsTable
      projects={projects}
      total={total}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      onEdit={onEdit}
      onDelete={onDelete}
      onManageMembers={onManageMembers}
    />
  );
};