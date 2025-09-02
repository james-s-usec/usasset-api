import React from 'react';
import { Box, IconButton } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { ProjectRole } from '../types/project.types';
import { RoleSelect } from './RoleSelect';

interface MemberActionsProps {
  role: ProjectRole;
  memberId: string;
  onUpdateRole: (memberId: string, role: ProjectRole) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
}

export const MemberActions: React.FC<MemberActionsProps> = ({
  role,
  memberId,
  onUpdateRole,
  onRemoveMember,
}) => {
  const isOwner = role === ProjectRole.OWNER;

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <RoleSelect
        value={role}
        onChange={(newRole) => onUpdateRole(memberId, newRole)}
        disabled={isOwner}
      />
      <IconButton
        edge="end"
        onClick={() => onRemoveMember(memberId)}
        color="error"
        disabled={isOwner}
      >
        <DeleteIcon />
      </IconButton>
    </Box>
  );
};