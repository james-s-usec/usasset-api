import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import type { Project } from '../types/project.types';
import { ProjectFormFields } from './ProjectFormFields';
import { ProjectDialogActions } from './ProjectDialogActions';
import type { ProjectFormData } from './ProjectFormFields';

interface ProjectDialogContentProps {
  open: boolean;
  project?: Project | null;
  formData: ProjectFormData;
  error: string | null;
  saving: boolean;
  onClose: () => void;
  onChange: (data: ProjectFormData) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

interface ProjectFormProps {
  project?: Project | null;
  formData: ProjectFormData;
  error: string | null;
  saving: boolean;
  onChange: (data: ProjectFormData) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onClose: () => void;
}

// Extracted form component - single responsibility
const ProjectForm: React.FC<ProjectFormProps> = ({
  project,
  formData,
  error,
  saving,
  onChange,
  onSubmit,
  onClose,
}) => (
  <form onSubmit={onSubmit}>
    <DialogTitle>
      {project ? 'Edit Project' : 'Create New Project'}
    </DialogTitle>
    <DialogContent>
      <ProjectFormFields
        formData={formData}
        error={error}
        onChange={onChange}
      />
    </DialogContent>
    <ProjectDialogActions
      saving={saving}
      project={project}
      onClose={onClose}
    />
  </form>
);

// Main component - simplified to just handle dialog wrapper
export const ProjectDialogContent: React.FC<ProjectDialogContentProps> = ({
  open,
  project,
  formData,
  error,
  saving,
  onClose,
  onChange,
  onSubmit,
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="sm"
    fullWidth
  >
    <ProjectForm
      project={project}
      formData={formData}
      error={error}
      saving={saving}
      onChange={onChange}
      onSubmit={onSubmit}
      onClose={onClose}
    />
  </Dialog>
);