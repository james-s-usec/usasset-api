import React from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { USER_ROLES } from '../types/user';
import type { UserRole } from '../types/user';

interface UserRoleSelectProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
}

export const UserRoleSelect = ({ 
  value, 
  onChange 
}: UserRoleSelectProps): React.ReactElement => {
  return (
    <FormControl fullWidth>
      <InputLabel>Role</InputLabel>
      <Select
        value={value}
        label="Role"
        onChange={(e) => onChange(e.target.value as UserRole)}
      >
        <MenuItem value={USER_ROLES.USER}>User</MenuItem>
        <MenuItem value={USER_ROLES.ADMIN}>Admin</MenuItem>
      </Select>
    </FormControl>
  );
};