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

// Helper function to create update data
const createUpdateData = (formData: ProjectFormData): UpdateProjectDto => ({
  name: formData.name,
  description: formData.description || undefined,
  status: formData.status,
});

// Helper function to create new project data
const createProjectData = (
  formData: ProjectFormData,
  currentUserId: string
): CreateProjectDto => ({
  name: formData.name,
  description: formData.description || undefined,
  status: formData.status,
  owner_id: currentUserId,
});

// Helper function to prepare save data based on project existence
const prepareSaveData = (
  formData: ProjectFormData,
  project: Project | null,
  currentUserId: string
): CreateProjectDto | UpdateProjectDto => {
  if (project) {
    return createUpdateData(formData);
  }
  return createProjectData(formData, currentUserId);
};

// Helper function to handle save operation
const performSave = async (
  saveData: CreateProjectDto | UpdateProjectDto,
  onSave: (data: CreateProjectDto | UpdateProjectDto) => Promise<void>,
  onClose: () => void
): Promise<void> => {
  await onSave(saveData);
  onClose();
};

// Context object for save operation
interface SaveContext {
  formData: ProjectFormData;
  project: Project | null;
  currentUserId: string;
  callbacks: UseProjectFormSubmitProps;
}

// Helper function to handle error
const handleSaveError = (
  err: unknown,
  setError: (error: string | null) => void
): void => {
  setError(err instanceof Error ? err.message : 'Failed to save project');
};

// Helper function to execute save with state management
const executeSave = async (context: SaveContext): Promise<void> => {
  const { formData, project, currentUserId, callbacks } = context;
  const { setSaving, setError, onSave, onClose } = callbacks;
  
  setSaving(true);
  setError(null);

  try {
    const saveData = prepareSaveData(formData, project, currentUserId);
    await performSave(saveData, onSave, onClose);
  } catch (err) {
    handleSaveError(err, setError);
  } finally {
    setSaving(false);
  }
};

// Helper function to validate form data
const validateFormData = (
  formData: ProjectFormData,
  setError: (error: string | null) => void
): boolean => {
  if (!formData.name.trim()) {
    setError('Project name is required');
    return false;
  }
  return true;
};

export const useProjectFormSubmit = (
  props: UseProjectFormSubmitProps
): UseProjectFormSubmitReturn => {
  const handleSubmit = async (
    e: React.FormEvent,
    formData: ProjectFormData,
    project: Project | null,
    currentUserId: string,
  ): Promise<void> => {
    e.preventDefault();
    
    if (!validateFormData(formData, props.setError)) {
      return;
    }

    await executeSave({
      formData,
      project,
      currentUserId,
      callbacks: props,
    });
  };

  return { handleSubmit };
};