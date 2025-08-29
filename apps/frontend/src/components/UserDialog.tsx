import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { UserFormFields } from './UserFormFields';
import type { UserData, UserRole } from '../types/user';

interface UserFormData {
  name: string;
  email: string;
  role: UserRole;
}

interface UserDialogProps {
  open: boolean;
  editingUser: UserData | null;
  formData: UserFormData;
  onClose: () => void;
  onSubmit: () => void;
  onFormChange: (field: keyof UserFormData, value: string | UserRole) => void;
  isValid: boolean;
}

export const UserDialog = (props: UserDialogProps): React.ReactElement => (
  <Dialog 
    open={props.open} 
    onClose={props.onClose} 
    maxWidth="sm" 
    fullWidth
  >
    <DialogTitle>
      {props.editingUser ? 'Edit User' : 'Create New User'}
    </DialogTitle>
    <DialogContent>
      <UserFormFields 
        formData={props.formData}
        editingUser={props.editingUser}
        onFormChange={props.onFormChange}
      />
    </DialogContent>
    <DialogActions>
      <Button onClick={props.onClose}>Cancel</Button>
      <Button
        onClick={props.onSubmit}
        variant="contained"
        disabled={!props.isValid}
      >
        {props.editingUser ? 'Update' : 'Create'}
      </Button>
    </DialogActions>
  </Dialog>
);