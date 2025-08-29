import { useCallback } from 'react';
import type { UserRole } from '../types/user';

interface UserFormData {
  name: string;
  email: string;
  role: UserRole;
}

interface UseFormHandlersProps {
  onFormChange: (field: keyof UserFormData, value: string | UserRole) => void;
}

export function useFormHandlers({ onFormChange }: UseFormHandlersProps): {
  handleNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRoleChange: (role: UserRole) => void;
} {
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    onFormChange('name', e.target.value);
  }, [onFormChange]);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    onFormChange('email', e.target.value);
  }, [onFormChange]);

  const handleRoleChange = useCallback((role: UserRole): void => {
    onFormChange('role', role);
  }, [onFormChange]);

  return { handleNameChange, handleEmailChange, handleRoleChange };
}