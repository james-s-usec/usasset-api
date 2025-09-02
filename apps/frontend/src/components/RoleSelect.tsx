import React from 'react';
import { Select, MenuItem } from '@mui/material';
import { ProjectRole } from '../types/project.types';

interface RoleSelectProps {
  value: ProjectRole;
  onChange: (role: ProjectRole) => void;
  disabled?: boolean;
  excludeOwner?: boolean;
}

const allRoleOptions: { value: ProjectRole; label: string }[] = [
  { value: ProjectRole.OWNER, label: 'Owner' },
  { value: ProjectRole.ADMIN, label: 'Admin' },
  { value: ProjectRole.MEMBER, label: 'Member' },
  { value: ProjectRole.VIEWER, label: 'Viewer' },
];

export const RoleSelect: React.FC<RoleSelectProps> = ({
  value,
  onChange,
  disabled = false,
  excludeOwner = false,
}) => {
  const roleOptions = excludeOwner ? allRoleOptions.slice(1) : allRoleOptions;

  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value as ProjectRole)}
      size="small"
      disabled={disabled}
      sx={{ minWidth: 120 }}
    >
      {roleOptions.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </Select>
  );
};