import type { UserRole } from '../types/user'
import { USER_ROLES } from '../types/user'

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const getRoleColor = (role?: UserRole): 'error' | 'primary' => {
  switch (role) {
    case USER_ROLES.ADMIN:
      return 'error'
    case USER_ROLES.USER:
    default:
      return 'primary'
  }
}