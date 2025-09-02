import type { CreateProjectDto, UpdateProjectDto, Project } from '../types/project.types';
import type { ProjectFormData } from '../components/ProjectFormFields';

interface UseProjectFormSubmitReturn {
  handleSubmit: (
    e: React.FormEvent,
    formData: ProjectFormData,
    project: Project | null,
    currentUserId: string
  ) => Promise<void>;
}

interface UseProjectFormSubmitProps {
  setSaving: (saving: boolean) => void;
  setError: (error: string | null) => void;
  onSave: (data: CreateProjectDto | UpdateProjectDto) => Promise<void>;
  onClose: () => void;
}

export const useProjectFormSubmit = ({
  setSaving,
  setError,
  onSave,
  onClose,
}: UseProjectFormSubmitProps): UseProjectFormSubmitReturn => {
  const validateForm = (formData: ProjectFormData): boolean => {
    if (!formData.name.trim()) {
      setError('Project name is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (
    e: React.FormEvent,
    formData: ProjectFormData,
    project: Project | null,
    currentUserId: string,
  ): Promise<void> => {
    e.preventDefault();
    
    if (!validateForm(formData)) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (project) {
        const updateData: UpdateProjectDto = {
          name: formData.name,
          description: formData.description || undefined,
          status: formData.status,
        };
        await onSave(updateData);
      } else {
        const createData: CreateProjectDto = {
          name: formData.name,
          description: formData.description || undefined,
          status: formData.status,
          owner_id: currentUserId,
        };
        await onSave(createData);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  return { handleSubmit };
};