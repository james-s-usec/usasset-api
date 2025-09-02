import React from 'react';
import {
  TextField,
  MenuItem,
  Box,
  Alert,
} from '@mui/material';
import { ProjectStatus } from '../types/project.types';

interface ProjectFormData {
  name: string;
  description: string;
  status: ProjectStatus;
}

interface ProjectFormFieldsProps {
  formData: ProjectFormData;
  error: string | null;
  onChange: (data: ProjectFormData) => void;
}

const projectStatuses: { value: ProjectStatus; label: string }[] = [
  { value: ProjectStatus.DRAFT, label: 'Draft' },
  { value: ProjectStatus.ACTIVE, label: 'Active' },
  { value: ProjectStatus.ON_HOLD, label: 'On Hold' },
  { value: ProjectStatus.COMPLETED, label: 'Completed' },
  { value: ProjectStatus.CANCELLED, label: 'Cancelled' },
];

const ProjectNameField: React.FC<{ value: string; onChange: (name: string) => void }> = ({ value, onChange }) => (
  <TextField
    label="Project Name"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    fullWidth
    required
    autoFocus
  />
);

const ProjectDescriptionField: React.FC<{ value: string; onChange: (desc: string) => void }> = ({ value, onChange }) => (
  <TextField
    label="Description"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    fullWidth
    multiline
    rows={3}
  />
);

const ProjectStatusField: React.FC<{ value: ProjectStatus; onChange: (status: ProjectStatus) => void }> = ({ value, onChange }) => (
  <TextField
    select
    label="Status"
    value={value}
    onChange={(e) => onChange(e.target.value as ProjectStatus)}
    fullWidth
  >
    {projectStatuses.map((option) => (
      <MenuItem key={option.value} value={option.value}>
        {option.label}
      </MenuItem>
    ))}
  </TextField>
);

export const ProjectFormFields: React.FC<ProjectFormFieldsProps> = ({
  formData,
  error,
  onChange,
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
      {error && <Alert severity="error">{error}</Alert>}
      <ProjectNameField
        value={formData.name}
        onChange={(name) => onChange({ ...formData, name })}
      />
      <ProjectDescriptionField
        value={formData.description}
        onChange={(description) => onChange({ ...formData, description })}
      />
      <ProjectStatusField
        value={formData.status}
        onChange={(status) => onChange({ ...formData, status })}
      />
    </Box>
  );
};

export type { ProjectFormData };