import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { ProjectRole } from '../types/project.types';
import type { UserData as User } from '../types/user';
import { AddMemberControls } from './AddMemberControls';

interface ProjectAddMemberFormProps {
  availableUsers: User[];
  onAddMember: (userId: string, role: ProjectRole) => Promise<void>;
}

export const ProjectAddMemberForm: React.FC<ProjectAddMemberFormProps> = ({
  availableUsers,
  onAddMember,
}) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<ProjectRole>(ProjectRole.MEMBER);

  const handleAddMember = async (): Promise<void> => {
    if (!selectedUser) return;
    await onAddMember(selectedUser.id, selectedRole);
    setSelectedUser(null);
    setSelectedRole(ProjectRole.MEMBER);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Add Member
      </Typography>
      <AddMemberControls
        availableUsers={availableUsers}
        selectedUser={selectedUser}
        selectedRole={selectedRole}
        onUserChange={setSelectedUser}
        onRoleChange={setSelectedRole}
        onAdd={handleAddMember}
      />
    </Box>
  );
};