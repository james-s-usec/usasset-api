import React from 'react';
import type { Project, CreateProjectDto, UpdateProjectDto } from '../types/project.types';
import { ProjectDialogContent } from './ProjectDialogContent';
import { useProjectForm } from '../hooks/useProjectForm';

interface ProjectDialogProps {
  open: boolean;
  project?: Project | null;
  currentUserId: string;
  onClose: () => void;
  onSave: (data: CreateProjectDto | UpdateProjectDto) => Promise<void>;
}


export const ProjectDialog: React.FC<ProjectDialogProps> = ({
  open,
  project,
  currentUserId,
  onClose,
  onSave,
}) => {
  const { formData, setFormData, saving, error, handleSubmit } = useProjectForm({
    project,
    currentUserId,
    open,
    onSave,
    onClose,
  });

  return (
    <ProjectDialogContent
      open={open}
      project={project}
      formData={formData}
      error={error}
      saving={saving}
      onClose={onClose}
      onChange={setFormData}
      onSubmit={handleSubmit}
    />
  );
};