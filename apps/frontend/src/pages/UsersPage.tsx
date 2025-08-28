import React, { useState, useEffect } from 'react'
import {
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Chip,
  Stack
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'

import { userApiService } from '../services/user-api'
import { logger } from '../services/logger'
import type { UserData, CreateUserRequest, UpdateUserRequest, UserRole } from '../types/user'
import { USER_ROLES } from '../types/user'

interface UserFormData {
  name: string
  email: string
  role: UserRole
}

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    role: USER_ROLES.USER
  })

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      logger.info('UsersPage: Starting user fetch')
      
      const response = await userApiService.getUsers(1, 50)
      setUsers(response.data.users)
      
      logger.info('UsersPage: Users loaded successfully', { 
        count: response.data.users.length,
        correlationId: response.correlationId 
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users'
      setError(errorMessage)
      logger.error('UsersPage: Failed to fetch users', { error: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    try {
      logger.info('UsersPage: Creating new user', { email: formData.email })
      
      const createData: CreateUserRequest = {
        email: formData.email,
        name: formData.name || undefined,
        role: formData.role
      }
      
      await userApiService.createUser(createData)
      
      logger.info('UsersPage: User created successfully')
      
      setDialogOpen(false)
      resetForm()
      await fetchUsers()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user'
      setError(errorMessage)
      logger.error('UsersPage: Failed to create user', { error: errorMessage })
    }
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    try {
      logger.info('UsersPage: Updating user', { userId: editingUser.id })
      
      const updateData: UpdateUserRequest = {
        name: formData.name || undefined,
        role: formData.role
      }
      
      await userApiService.updateUser(editingUser.id, updateData)
      
      logger.info('UsersPage: User updated successfully')
      
      setDialogOpen(false)
      setEditingUser(null)
      resetForm()
      await fetchUsers()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user'
      setError(errorMessage)
      logger.error('UsersPage: Failed to update user', { error: errorMessage })
    }
  }

  const handleDeleteUser = async (user: UserData) => {
    if (!window.confirm(`Delete user "${user.name || user.email}"?`)) return

    try {
      logger.info('UsersPage: Deleting user', { userId: user.id })
      
      await userApiService.deleteUser(user.id)
      
      logger.info('UsersPage: User deleted successfully')
      
      await fetchUsers()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user'
      setError(errorMessage)
      logger.error('UsersPage: Failed to delete user', { error: errorMessage })
    }
  }

  const openCreateDialog = () => {
    setEditingUser(null)
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (user: UserData) => {
    setEditingUser(user)
    setFormData({
      name: user.name || '',
      email: user.email,
      role: user.role || USER_ROLES.USER
    })
    setDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: USER_ROLES.USER
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleColor = (role?: UserRole) => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return 'error'
      case USER_ROLES.USER:
      default:
        return 'primary'
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  if (loading) {
    return (
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: '100vw', px: 2, mt: 4, mb: 4, mx: 'auto' }}>
      <Box 
        display="flex" 
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between" 
        alignItems={{ xs: 'stretch', sm: 'center' }}
        gap={2}
        mb={3}
      >
        <Typography variant="h4" component="h1">
          User Management
        </Typography>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchUsers}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreateDialog}
          >
            Add User
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name || '—'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role || USER_ROLES.USER}
                      color={getRoleColor(user.role)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(user.created_at)}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => openEditDialog(user)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteUser(user)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'Edit User' : 'Create New User'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
              required
              disabled={!!editingUser}
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                label="Role"
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              >
                <MenuItem value={USER_ROLES.USER}>User</MenuItem>
                <MenuItem value={USER_ROLES.ADMIN}>Admin</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={editingUser ? handleUpdateUser : handleCreateUser}
            variant="contained"
            disabled={!formData.email}
          >
            {editingUser ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}