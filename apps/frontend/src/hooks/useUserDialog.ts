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

export const useUserDialog = (): UseUserDialogReturn => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [formData, setFormData] = useState<UserFormData>(initialFormData)

  const resetForm = (): void => setFormData(initialFormData);

  const openCreateDialog = (): void => {
    setEditingUser(null)
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (user: UserData): void => {
    setEditingUser(user)
    setFormData(buildFormData(user))
    setDialogOpen(true)
  }

  const closeDialog = (): void => {
    setDialogOpen(false)
    setEditingUser(null)
    resetForm()
  }

  const updateFormData = (
    field: keyof UserFormData, 
    value: string | UserRole
  ): void => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const isFormValid = Boolean(formData.email.trim())

  return {
    dialogOpen,
    editingUser,
    formData,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    updateFormData,
    resetForm,
    isFormValid
  }
}