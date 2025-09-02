import React from 'react';
import { DialogActions, Button } from '@mui/material';
import type { Project } from '../types/project.types';

interface ProjectDialogActionsProps {
  saving: boolean;
  project?: Project | null;
  onClose: () => void;
}

const getSubmitButtonText = (saving: boolean, project?: Project | null): string => {
  if (saving) return 'Saving...';
  return project ? 'Update' : 'Create';
};

export const ProjectDialogActions: React.FC<ProjectDialogActionsProps> = ({
  saving,
  project,
  onClose,
}) => {
  return (
    <DialogActions>
      <Button onClick={onClose} disabled={saving}>
        Cancel
      </Button>
      <Button type="submit" variant="contained" disabled={saving}>
        {getSubmitButtonText(saving, project)}
      </Button>
    </DialogActions>
  );
};