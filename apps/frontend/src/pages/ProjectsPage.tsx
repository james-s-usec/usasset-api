import React, { useState, useCallback } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useProjects } from '../hooks/useProjects';
import { ProjectsTable } from '../components/ProjectsTable';
import { ProjectDialog } from '../components/ProjectDialog';
import { ProjectMembersDialog } from '../components/ProjectMembersDialog';
import type { Project, CreateProjectDto, UpdateProjectDto } from '../types/project.types';

// Mock current user ID - in a real app, this would come from auth context
const CURRENT_USER_ID = 'current-user-id';

export const ProjectsPage: React.FC = () => {
  const {
    projects,
    loading,
    error,
    total,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  } = useProjects();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [membersProject, setMembersProject] = useState<Project | null>(null);

  // Fetch projects when pagination changes
  React.useEffect(() => {
    void fetchProjects({ page, limit: pageSize });
  }, [page, pageSize, fetchProjects]);

  const handleCreate = (): void => {
    setSelectedProject(null);
    setDialogOpen(true);
  };

  const handleEdit = (project: Project): void => {
    setSelectedProject(project);
    setDialogOpen(true);
  };

  const handleDelete = async (project: Project): Promise<void> => {
    if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
      const success = await deleteProject(project.id);
      if (success) {
        // If we deleted the last item on this page, go to previous page
        if (projects.length === 1 && page > 1) {
          setPage(page - 1);
        }
      }
    }
  };

  const handleSaveProject = useCallback(async (data: CreateProjectDto | UpdateProjectDto) => {
    if (selectedProject) {
      // Update existing project
      await updateProject(selectedProject.id, data as UpdateProjectDto);
    } else {
      // Create new project
      await createProject(data as CreateProjectDto);
    }
  }, [selectedProject, createProject, updateProject]);

  const handleManageMembers = (project: Project): void => {
    setMembersProject(project);
    setMembersDialogOpen(true);
  };

  const handlePageChange = (newPage: number): void => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number): void => {
    setPageSize(newPageSize);
    setPage(1);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Projects
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          New Project
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && projects.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <ProjectsTable
          projects={projects}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onManageMembers={handleManageMembers}
        />
      )}

      <ProjectDialog
        open={dialogOpen}
        project={selectedProject}
        currentUserId={CURRENT_USER_ID}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveProject}
      />

      <ProjectMembersDialog
        open={membersDialogOpen}
        project={membersProject}
        onClose={() => setMembersDialogOpen(false)}
      />
    </Container>
  );
};