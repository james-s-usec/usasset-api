import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogActions,
  Button,
} from '@mui/material';
import type { Project } from '../types/project.types';
import { ProjectMembersDialogContent } from './ProjectMembersDialogContent';
import { useProjectMemberActions } from '../hooks/useProjectMemberActions';

const getDialogTitle = (project: Project | null): string => {
  return project ? `Manage Members - ${project.name}` : 'Manage Members';
};

interface ProjectMembersDialogProps {
  open: boolean;
  project: Project | null;
  onClose: () => void;
}

export const ProjectMembersDialog: React.FC<ProjectMembersDialogProps> = ({
  open,
  project,
  onClose,
}) => {
  const actions = useProjectMemberActions(open, project);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>{getDialogTitle(project)}</DialogTitle>
      <ProjectMembersDialogContent
        members={actions.members}
        loading={actions.loading}
        error={actions.error}
        availableUsers={actions.availableUsers}
        onAddMember={actions.handleAddMember}
        onUpdateRole={actions.handleUpdateRole}
        onRemoveMember={actions.handleRemoveMember}
      />
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};