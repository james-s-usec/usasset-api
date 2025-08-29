import { useState } from 'react'
import type { UserData, UserRole } from '../types/user'
import { USER_ROLES } from '../types/user'

interface UserFormData {
  name: string
  email: string
  role: UserRole
}

interface UseUserDialogReturn {
  dialogOpen: boolean
  editingUser: UserData | null
  formData: UserFormData
  openCreateDialog: () => void
  openEditDialog: (user: UserData) => void
  closeDialog: () => void
  updateFormData: (field: keyof UserFormData, value: string | UserRole) => void
  resetForm: () => void
  isFormValid: boolean
}

const initialFormData: UserFormData = {
  name: '',
  email: '',
  role: USER_ROLES.USER
}

const buildFormData = (user: UserData): UserFormData => ({
  name: user.name || '',
  email: user.email,
  role: user.role || USER_ROLES.USER
});

const useUserDialogState = (): {
  dialogOpen: boolean;
  editingUser: UserData | null;
  formData: UserFormData;
  setDialogOpen: (open: boolean) => void;
  setEditingUser: (user: UserData | null) => void;
  setFormData: (data: UserFormData | ((prev: UserFormData) => UserFormData)) => void;
} => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState<UserFormData>(initialFormData);

  return {
    dialogOpen,
    editingUser,
    formData,
    setDialogOpen,
    setEditingUser,
    setFormData
  };
};

const createDialogActions = (
  setDialogOpen: (open: boolean) => void,
  setEditingUser: (user: UserData | null) => void,
  setFormData: (data: UserFormData) => void
): { resetForm: () => void; openCreateDialog: () => void; openEditDialog: (user: UserData) => void; closeDialog: () => void } => {
  const resetForm = (): void => setFormData(initialFormData);

  const openCreateDialog = (): void => {
    setEditingUser(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (user: UserData): void => {
    setEditingUser(user);
    setFormData(buildFormData(user));
    setDialogOpen(true);
  };

  const closeDialog = (): void => {
    setDialogOpen(false);
    setEditingUser(null);
    resetForm();
  };

  return { resetForm, openCreateDialog, openEditDialog, closeDialog };
};

export const useUserDialog = (): UseUserDialogReturn => {
  const state = useUserDialogState();
  const actions = createDialogActions(state.setDialogOpen, state.setEditingUser, state.setFormData);

  const updateFormData = (field: keyof UserFormData, value: string | UserRole): void => {
    state.setFormData((prev: UserFormData) => ({ ...prev, [field]: value }));
  };

  const isFormValid = Boolean(state.formData.email.trim());

  return {
    dialogOpen: state.dialogOpen,
    editingUser: state.editingUser,
    formData: state.formData,
    openCreateDialog: actions.openCreateDialog,
    openEditDialog: actions.openEditDialog,
    closeDialog: actions.closeDialog,
    updateFormData,
    resetForm: actions.resetForm,
    isFormValid
  };
};