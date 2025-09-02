import type { Project, CreateProjectDto, UpdateProjectDto } from '../types/project.types';
import { useProjectFormState } from './useProjectFormState';
import { useProjectFormSubmit } from './useProjectFormSubmit';
import type { ProjectFormData } from '../components/ProjectFormFields';

interface UseProjectFormReturn {
  formData: ProjectFormData;
  setFormData: (data: ProjectFormData) => void;
  saving: boolean;
  error: string | null;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

interface UseProjectFormProps {
  project?: Project | null;
  currentUserId: string;
  open: boolean;
  onSave: (data: CreateProjectDto | UpdateProjectDto) => Promise<void>;
  onClose: () => void;
}

export const useProjectForm = ({
  project,
  currentUserId,
  open,
  onSave,
  onClose,
}: UseProjectFormProps): UseProjectFormReturn => {
  const formState = useProjectFormState({ project, open });
  const { handleSubmit: handleFormSubmit } = useProjectFormSubmit({
    setSaving: formState.setSaving,
    setError: formState.setError,
    onSave,
    onClose,
  });

  const handleSubmit = (e: React.FormEvent): Promise<void> => {
    return handleFormSubmit(e, formState.formData, project || null, currentUserId);
  };

  return {
    formData: formState.formData,
    setFormData: formState.setFormData,
    saving: formState.saving,
    error: formState.error,
    handleSubmit,
  };
};