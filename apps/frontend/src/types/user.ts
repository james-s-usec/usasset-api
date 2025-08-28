export interface UserData {
  id: string
  email: string
  name?: string
  role?: UserRole
  is_deleted: boolean
  created_at: string
  created_by?: string | null
  updated_at: string
  updated_by?: string | null
  deleted_at?: string | null
  deleted_by?: string | null
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

export type UserRole = 'USER' | 'ADMIN'

export const USER_ROLES = {
  USER: 'USER' as UserRole,
  ADMIN: 'ADMIN' as UserRole
} as const