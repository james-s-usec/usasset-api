import React from 'react';
import { TextField, Box } from '@mui/material';
import { UserRoleSelect } from './UserRoleSelect';
import { useFormHandlers } from '../hooks/useFormHandlers';
import type { UserData, UserRole } from '../types/user';

interface UserFormData {
  name: string;
  email: string;
  role: UserRole;
}

interface UserFormFieldsProps {
  formData: UserFormData;
  editingUser: UserData | null;
  onFormChange: (field: keyof UserFormData, value: string | UserRole) => void;
}

interface NameFieldProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const NameField = ({ value, onChange }: NameFieldProps): React.ReactElement => (
  <TextField
    label="Name"
    value={value}
    onChange={onChange}
    fullWidth
  />
);

interface EmailFieldProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
}

const EmailField = ({ value, onChange, disabled }: EmailFieldProps): React.ReactElement => (
  <TextField
    label="Email"
    type="email"
    value={value}
    onChange={onChange}
    fullWidth
    required
    disabled={disabled}
  />
);

export const UserFormFields = ({ 
  formData, 
  editingUser, 
  onFormChange 
}: UserFormFieldsProps): React.ReactElement => {
  const handlers = useFormHandlers({ onFormChange });

  return (
    <Box 
      display="flex" 
      flexDirection="column" 
      gap={2} 
      sx={{ mt: 1 }}
    >
      <NameField value={formData.name} onChange={handlers.handleNameChange} />
      <EmailField 
        value={formData.email} 
        onChange={handlers.handleEmailChange}
        disabled={!!editingUser} 
      />
      <UserRoleSelect value={formData.role} onChange={handlers.handleRoleChange} />
    </Box>
  );
};