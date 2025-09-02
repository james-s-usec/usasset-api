import React from 'react';
import { Box, Button } from '@mui/material';
import { PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { ProjectRole } from '../types/project.types';
import type { UserData as User } from '../types/user';
import { UserAutocomplete } from './UserAutocomplete';
import { RoleSelect } from './RoleSelect';

const AddButton: React.FC<{ onClick: () => void; disabled: boolean }> = ({ onClick, disabled }) => (
  <Button
    variant="contained"
    startIcon={<PersonAddIcon />}
    onClick={onClick}
    disabled={disabled}
  >
    Add
  </Button>
);

interface AddMemberControlsProps {
  availableUsers: User[];
  selectedUser: User | null;
  selectedRole: ProjectRole;
  onUserChange: (user: User | null) => void;
  onRoleChange: (role: ProjectRole) => void;
  onAdd: () => void;
}

export const AddMemberControls: React.FC<AddMemberControlsProps> = ({
  availableUsers,
  selectedUser,
  selectedRole,
  onUserChange,
  onRoleChange,
  onAdd,
}) => {
  return (
    <Box display="flex" gap={2} alignItems="center">
      <UserAutocomplete
        options={availableUsers}
        value={selectedUser}
        onChange={onUserChange}
      />
      <RoleSelect
        value={selectedRole}
        onChange={onRoleChange}
        excludeOwner
      />
      <AddButton onClick={onAdd} disabled={!selectedUser} />
    </Box>
  );
};