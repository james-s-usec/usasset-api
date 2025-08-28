import { apiService } from './api'
import { logger } from './logger'
import type {
  UserData,
  CreateUserRequest,
  UpdateUserRequest,
  BulkCreateUserRequest,
  BulkUpdateUserRequest,
  BulkDeleteUserRequest,
  ApiResponse,
  UserListResponse
} from '../types/user'

export class UserApiService {
  private static readonly BASE_PATH = '/api/users'

  async getUsers(page = 1, limit = 10): Promise<ApiResponse<UserListResponse>> {
    logger.info('UserAPI: Fetching users', { page, limit })
    
    const response = await apiService.get<ApiResponse<UserListResponse>>(
      `${UserApiService.BASE_PATH}?page=${page}&limit=${limit}`
    )
    
    logger.info('UserAPI: Users fetched successfully', { 
      count: response.data.users.length,
      total: response.data.pagination.total,
      correlationId: response.correlationId
    })
    
    return response
  }

  async getUserById(id: string): Promise<ApiResponse<UserData>> {
    logger.info('UserAPI: Fetching user by ID', { userId: id })
    
    const response = await apiService.get<ApiResponse<UserData>>(
      `${UserApiService.BASE_PATH}/${id}`
    )
    
    logger.info('UserAPI: User fetched successfully', { 
      userId: id,
      correlationId: response.correlationId
    })
    
    return response
  }

  async createUser(userData: CreateUserRequest): Promise<ApiResponse<UserData>> {
    logger.info('UserAPI: Creating user', { email: userData.email, role: userData.role })
    
    const response = await apiService.post<ApiResponse<UserData>>(
      UserApiService.BASE_PATH,
      userData
    )
    
    logger.info('UserAPI: User created successfully', { 
      userId: response.data.id,
      email: response.data.email,
      correlationId: response.correlationId
    })
    
    return response
  }

  async updateUser(id: string, userData: UpdateUserRequest): Promise<ApiResponse<UserData>> {
    logger.info('UserAPI: Updating user', { userId: id, updates: userData })
    
    const response = await apiService.patch<ApiResponse<UserData>>(
      `${UserApiService.BASE_PATH}/${id}`,
      userData
    )
    
    logger.info('UserAPI: User updated successfully', { 
      userId: id,
      correlationId: response.correlationId
    })
    
    return response
  }

  async deleteUser(id: string): Promise<ApiResponse<{ message: string }>> {
    logger.info('UserAPI: Deleting user', { userId: id })
    
    const response = await apiService.delete<ApiResponse<{ message: string }>>(
      `${UserApiService.BASE_PATH}/${id}`
    )
    
    logger.info('UserAPI: User deleted successfully', { 
      userId: id,
      correlationId: response.correlationId
    })
    
    return response
  }

  async bulkCreateUsers(request: BulkCreateUserRequest): Promise<ApiResponse<UserData[]>> {
    logger.info('UserAPI: Bulk creating users', { count: request.users.length })
    
    const response = await apiService.post<ApiResponse<UserData[]>>(
      `${UserApiService.BASE_PATH}/bulk`,
      request
    )
    
    logger.info('UserAPI: Users bulk created successfully', { 
      created: response.data.length,
      correlationId: response.correlationId
    })
    
    return response
  }

  async bulkUpdateUsers(request: BulkUpdateUserRequest): Promise<ApiResponse<UserData[]>> {
    logger.info('UserAPI: Bulk updating users', { count: request.updates.length })
    
    const response = await apiService.patch<ApiResponse<UserData[]>>(
      `${UserApiService.BASE_PATH}/bulk`,
      request
    )
    
    logger.info('UserAPI: Users bulk updated successfully', { 
      updated: response.data.length,
      correlationId: response.correlationId
    })
    
    return response
  }

  async bulkDeleteUsers(request: BulkDeleteUserRequest): Promise<ApiResponse<{ deleted: number }>> {
    logger.info('UserAPI: Bulk deleting users', { count: request.ids.length })
    
    const response = await apiService.delete<ApiResponse<{ deleted: number }>>(
      `${UserApiService.BASE_PATH}/bulk`
    )
    
    logger.info('UserAPI: Users bulk deleted successfully', { 
      deleted: response.data.deleted,
      correlationId: response.correlationId
    })
    
    return response
  }
}

export const userApiService = new UserApiService()