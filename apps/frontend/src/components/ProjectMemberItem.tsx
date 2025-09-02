import React from 'react';
import {
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import type { ProjectMember } from '../types/project.types';
import { ProjectRole } from '../types/project.types';
import { MemberActions } from './MemberActions';

interface ProjectMemberItemProps {
  member: ProjectMember;
  onUpdateRole: (memberId: string, role: ProjectRole) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
}

export const ProjectMemberItem: React.FC<ProjectMemberItemProps> = ({
  member,
  onUpdateRole,
  onRemoveMember,
}) => {
  // Handle case where user data is not populated
  if (!member.user) {
    return (
      <ListItem divider>
        <ListItemText
          primary="Unknown User"
          secondary="User data not available"
        />
      </ListItem>
    );
  }

  return (
    <ListItem divider>
      <ListItemText
        primary={member.user.name || member.user.email}
        secondary={member.user.email}
      />
      <ListItemSecondaryAction>
        <MemberActions
          role={member.role}
          memberId={member.id}
          onUpdateRole={onUpdateRole}
          onRemoveMember={onRemoveMember}
        />
      </ListItemSecondaryAction>
    </ListItem>
  );
};