import React from 'react';
import { List } from '@mui/material';
import type { ProjectMember } from '../types/project.types';
import { ProjectRole } from '../types/project.types';
import { ProjectMemberItem } from './ProjectMemberItem';
import { MembersLoadingState } from './MembersLoadingState';

interface ProjectMembersListProps {
  members: ProjectMember[];
  loading: boolean;
  error: string | null;
  onUpdateRole: (memberId: string, role: ProjectRole) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
}

export const ProjectMembersList: React.FC<ProjectMembersListProps> = ({
  members,
  loading,
  error,
  onUpdateRole,
  onRemoveMember,
}) => {
  const loadingState = (
    <MembersLoadingState
      loading={loading}
      error={error}
      hasMembers={members.length > 0}
    />
  );

  if (loading || error || members.length === 0) {
    return loadingState;
  }

  return (
    <List>
      {members.map((member) => (
        <ProjectMemberItem
          key={member.id}
          member={member}
          onUpdateRole={onUpdateRole}
          onRemoveMember={onRemoveMember}
        />
      ))}
    </List>
  );
};