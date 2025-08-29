import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Box
} from '@mui/material'

import type { UserData, UserRole } from '../types/user'
import { USER_ROLES } from '../types/user'

interface UserFormData {
  name: string
  email: string
  role: UserRole
}

interface UserDialogProps {
  open: boolean
  editingUser: UserData | null
  formData: UserFormData
  onClose: () => void
  onSubmit: () => void
  onFormChange: (field: keyof UserFormData, value: string | UserRole) => void
  isValid: boolean
}

export const UserDialog: React.FC<UserDialogProps> = ({
  open,
  editingUser,
  formData,
  onClose,
  onSubmit,
  onFormChange,
  isValid
}) => {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFormChange('name', e.target.value)
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFormChange('email', e.target.value)
  }

  const handleRoleChange = (role: UserRole) => {
    onFormChange('role', role)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editingUser ? 'Edit User' : 'Create New User'}
      </DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} sx={{ mt: 1 }}>
          <TextField
            label="Name"
            value={formData.name}
            onChange={handleNameChange}
            fullWidth
          />
          <TextField
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleEmailChange}
            fullWidth
            required
            disabled={!!editingUser}
          />
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              value={formData.role}
              label="Role"
              onChange={(e) => handleRoleChange(e.target.value as UserRole)}
            >
              <MenuItem value={USER_ROLES.USER}>User</MenuItem>
              <MenuItem value={USER_ROLES.ADMIN}>Admin</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          disabled={!isValid}
        >
          {editingUser ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}