import React from 'react';
import {
  DialogContent,
  Divider,
  Typography,
} from '@mui/material';
import type { ProjectMember } from '../types/project.types';
import type { UserData as User } from '../types/user';
import { ProjectRole } from '../types/project.types';
import { ProjectMembersList } from './ProjectMembersList';
import { ProjectAddMemberForm } from './ProjectAddMemberForm';

interface ProjectMembersDialogContentProps {
  members: ProjectMember[];
  loading: boolean;
  error: string | null;
  availableUsers: User[];
  onAddMember: (userId: string, role: ProjectRole) => Promise<void>;
  onUpdateRole: (memberId: string, role: ProjectRole) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
}

export const ProjectMembersDialogContent: React.FC<ProjectMembersDialogContentProps> = ({
  members,
  loading,
  error,
  availableUsers,
  onAddMember,
  onUpdateRole,
  onRemoveMember,
}) => {
  return (
    <DialogContent>
      <ProjectAddMemberForm
        availableUsers={availableUsers}
        onAddMember={onAddMember}
      />
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle2" gutterBottom>
        Current Members ({members.length})
      </Typography>
      
      <ProjectMembersList
        members={members}
        loading={loading}
        error={error}
        onUpdateRole={onUpdateRole}
        onRemoveMember={onRemoveMember}
      />
    </DialogContent>
  );
};