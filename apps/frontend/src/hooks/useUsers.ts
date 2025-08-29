import { } from 'react'
import { userApiService } from '../services/user-api'
import { logger } from '../services/logger'
import { useDebugState } from './useDebugState'
import { useDebugApiEffect } from './useDebugEffect'
import { logHookCall, logApiCall } from '../utils/debug'
import type { UserData, CreateUserRequest, UpdateUserRequest } from '../types/user'

interface UseUsersReturn {
  users: UserData[]
  loading: boolean
  error: string | null
  fetchUsers: () => Promise<void>
  createUser: (data: CreateUserRequest) => Promise<void>
  updateUser: (id: string, data: UpdateUserRequest) => Promise<void>
  deleteUser: (user: UserData) => Promise<void>
  clearError: () => void
}

export const useUsers = (): UseUsersReturn => {
  logHookCall('useUsers', 'entry')

  // Enhanced state with debug logging
  const [users, setUsers] = useDebugState<UserData[]>([], {
    name: 'users',
    componentName: 'useUsers',
    logAllChanges: true
  })
  
  const [loading, setLoading] = useDebugState(true, {
    name: 'loading',
    componentName: 'useUsers'
  })
  
  const [error, setError] = useDebugState<string | null>(null, {
    name: 'error',
    componentName: 'useUsers'
  })

  const fetchUsers = async () => {
    logHookCall('useUsers.fetchUsers', 'entry')
    
    try {
      setLoading(true)
      setError(null)
      
      logger.info('useUsers: Starting user fetch')
      logApiCall('GET', '/users', { page: 1, limit: 50 })
      
      const response = await userApiService.getUsers(1, 50)
      setUsers(response.data.users)
      
      logger.info('useUsers: Users loaded successfully', { 
        count: response.data.users.length,
        correlationId: response.correlationId 
      })
      
      logApiCall('GET', '/users', { page: 1, limit: 50 }, {
        count: response.data.users.length,
        correlationId: response.correlationId
      })
      
      logHookCall('useUsers.fetchUsers', 'exit', { 
        usersCount: response.data.users.length 
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users'
      setError(errorMessage)
      logger.error('useUsers: Failed to fetch users', { error: errorMessage })
      logApiCall('GET', '/users', { page: 1, limit: 50 }, undefined, err)
    } finally {
      setLoading(false)
    }
  }

  const createUser = async (createData: CreateUserRequest) => {
    logHookCall('useUsers.createUser', 'entry', { email: '***' })
    
    try {
      logger.info('useUsers: Creating new user', { email: createData.email })
      logApiCall('POST', '/users', { ...createData, email: '***' })
      
      await userApiService.createUser(createData)
      
      logger.info('useUsers: User created successfully')
      logApiCall('POST', '/users', { ...createData, email: '***' }, { success: true })
      
      await fetchUsers()
      logHookCall('useUsers.createUser', 'exit', { success: true })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user'
      setError(errorMessage)
      logger.error('useUsers: Failed to create user', { error: errorMessage })
      logApiCall('POST', '/users', { ...createData, email: '***' }, undefined, err)
      throw err
    }
  }

  const updateUser = async (userId: string, updateData: UpdateUserRequest) => {
    logHookCall('useUsers.updateUser', 'entry', { userId })
    
    try {
      logger.info('useUsers: Updating user', { userId })
      logApiCall('PUT', `/users/${userId}`, updateData)
      
      await userApiService.updateUser(userId, updateData)
      
      logger.info('useUsers: User updated successfully')
      logApiCall('PUT', `/users/${userId}`, updateData, { success: true })
      
      await fetchUsers()
      logHookCall('useUsers.updateUser', 'exit', { userId, success: true })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user'
      setError(errorMessage)
      logger.error('useUsers: Failed to update user', { error: errorMessage })
      logApiCall('PUT', `/users/${userId}`, updateData, undefined, err)
      throw err
    }
  }

  const deleteUser = async (user: UserData) => {
    logHookCall('useUsers.deleteUser', 'entry', { userId: user.id })
    
    if (!window.confirm(`Delete user "${user.name || user.email}"?`)) {
      logHookCall('useUsers.deleteUser', 'exit', { cancelled: true })
      return
    }

    try {
      logger.info('useUsers: Deleting user', { userId: user.id })
      logApiCall('DELETE', `/users/${user.id}`)
      
      await userApiService.deleteUser(user.id)
      
      logger.info('useUsers: User deleted successfully')
      logApiCall('DELETE', `/users/${user.id}`, undefined, { success: true })
      
      await fetchUsers()
      logHookCall('useUsers.deleteUser', 'exit', { userId: user.id, success: true })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user'
      setError(errorMessage)
      logger.error('useUsers: Failed to delete user', { error: errorMessage })
      logApiCall('DELETE', `/users/${user.id}`, undefined, undefined, err)
    }
  }

  const clearError = () => {
    logHookCall('useUsers.clearError', 'entry')
    setError(null)
  }

  // Replace useEffect with debug version
  useDebugApiEffect(
    fetchUsers,
    [], // Empty deps for mount only
    {
      name: 'initialFetch',
      componentName: 'useUsers',
      logDependencies: false
    }
  )

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    clearError
  }
}