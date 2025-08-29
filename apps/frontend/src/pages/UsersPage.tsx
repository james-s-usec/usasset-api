import React from 'react'
import {
  Box,
  Alert,
  CircularProgress
} from '@mui/material'

import { useUsers } from '../hooks/useUsers'
import { useUserDialog } from '../hooks/useUserDialog'
import { useDebugComponent } from '../hooks/useDebugComponent'
import { UsersPageHeader } from '../components/UsersPageHeader'
import { UsersTable } from '../components/UsersTable'
import { UserDialog } from '../components/UserDialog'
import type { UserData, CreateUserRequest, UpdateUserRequest } from '../types/user'

export const UsersPage: React.FC = () => {
  // Debug logging for the main UsersPage component
  const { logEvent, logCustom, startTiming, endTiming } = useDebugComponent({
    name: 'UsersPage',
    trackRenders: true,
    trackPerformance: true
  })

  const {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    clearError
  } = useUsers()

  const {
    dialogOpen,
    editingUser,
    formData,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    updateFormData,
    isFormValid
  } = useUserDialog()

  const handleSubmit = async () => {
    const operation = editingUser ? 'update' : 'create'
    const timingMark = startTiming(`${operation}-user`)
    
    logEvent('submit', `user-${operation}-form`, {
      editingUser: editingUser?.id,
      formData: Object.keys(formData)
    })

    try {
      if (editingUser) {
        const updateData: UpdateUserRequest = {
          name: formData.name || undefined,
          role: formData.role
        }
        logCustom(`Updating user ${editingUser.id}`, { updateData })
        await updateUser(editingUser.id, updateData)
        logCustom(`Successfully updated user ${editingUser.id}`)
      } else {
        const createData: CreateUserRequest = {
          email: formData.email,
          name: formData.name || undefined,
          role: formData.role
        }
        logCustom('Creating new user', { createData: { ...createData, email: '***' } }) // Hide email in logs
        await createUser(createData)
        logCustom('Successfully created new user')
      }
      closeDialog()
      endTiming(timingMark, `${operation}-user-success`)
    } catch (error) {
      logCustom(`Failed to ${operation} user`, { error })
      endTiming(timingMark, `${operation}-user-error`)
      // Error handling is done in the hook
    }
  }

  if (loading) {
    return (
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  // Enhanced event handlers with debug logging
  const handleRefresh = () => {
    logEvent('click', 'refresh-button')
    fetchUsers()
  }

  const handleCreateDialog = () => {
    logEvent('click', 'create-user-button')
    openCreateDialog()
  }

  const handleEditDialog = (user: UserData) => {
    logEvent('click', 'edit-user-button', { userId: user.id })
    openEditDialog(user)
  }

  const handleDeleteUser = async (userId: string) => {
    logEvent('click', 'delete-user-button', { userId })
    const timingMark = startTiming('delete-user')
    
    try {
      await deleteUser(userId)
      logCustom(`Successfully deleted user ${userId}`)
      endTiming(timingMark, 'delete-user-success')
    } catch (error) {
      logCustom(`Failed to delete user ${userId}`, { error })
      endTiming(timingMark, 'delete-user-error')
    }
  }

  const handleCloseDialog = () => {
    logEvent('click', 'close-dialog')
    closeDialog()
  }

  const handleClearError = () => {
    logEvent('click', 'clear-error')
    clearError()
  }

  // Log state changes
  logCustom('Component state', {
    usersCount: users.length,
    loading,
    hasError: !!error,
    dialogOpen,
    editingUser: !!editingUser
  })

  if (loading) {
    return (
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: '100vw', px: 2, mt: 4, mb: 4, mx: 'auto' }}>
      <UsersPageHeader
        onRefresh={handleRefresh}
        onCreate={handleCreateDialog}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={handleClearError}>
          {error}
        </Alert>
      )}

      <UsersTable
        users={users}
        onEdit={handleEditDialog}
        onDelete={handleDeleteUser}
      />

      <UserDialog
        open={dialogOpen}
        editingUser={editingUser}
        formData={formData}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        onFormChange={updateFormData}
        isValid={isFormValid}
      />
    </Box>
  )
}