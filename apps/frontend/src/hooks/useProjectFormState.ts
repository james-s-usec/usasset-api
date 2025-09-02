import { useState, useEffect } from 'react';
import type { Project } from '../types/project.types';
import { ProjectStatus } from '../types/project.types';
import type { ProjectFormData } from '../components/ProjectFormFields';

const createInitialFormData = (project?: Project | null): ProjectFormData => ({
  name: project?.name || '',
  description: project?.description || '',
  status: project?.status || ProjectStatus.DRAFT,
});

interface UseProjectFormStateProps {
  project?: Project | null;
  open: boolean;
}

interface UseProjectFormStateReturn {
  formData: ProjectFormData;
  setFormData: (data: ProjectFormData) => void;
  saving: boolean;
  setSaving: (saving: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useProjectFormState = ({ project, open }: UseProjectFormStateProps): UseProjectFormStateReturn => {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    status: ProjectStatus.DRAFT,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormData(createInitialFormData(project));
    setError(null);
  }, [project, open]);

  return {
    formData,
    setFormData,
    saving,
    setSaving,
    error,
    setError,
  };
};