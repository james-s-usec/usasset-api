export interface UserData {
  id: string
  email: string
  name?: string
  role?: UserRole
  created_at: string
  updated_at: string
}

export interface CreateUserRequest {
  email: string
  name?: string
  role?: UserRole
}

export interface UpdateUserRequest {
  name?: string
  role?: UserRole
}

export interface BulkCreateUserRequest {
  users: CreateUserRequest[]
}

export interface BulkUpdateUserRequest {
  updates: Array<{
    id: string
    name?: string
    role?: UserRole
  }>
}

export interface BulkDeleteUserRequest {
  ids: string[]
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  correlationId: string
  timestamp: string
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string | string[]
    details?: string
    statusCode: number
  }
  correlationId: string
  timestamp: string
}

export interface UserListResponse {
  users: UserData[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN'

export const USER_ROLES = {
  USER: 'USER' as UserRole,
  ADMIN: 'ADMIN' as UserRole,
  SUPER_ADMIN: 'SUPER_ADMIN' as UserRole
} as const