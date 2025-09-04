// Filter component extracted from FileFilterBar
import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { FolderMenuItem } from './FileFilterBar.helpers';
import type { FileFilters } from './FileFilterBar';

interface Folder {
  id: string;
  name: string;
  color: string;
  is_default: boolean;
  file_count: number;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
}

// Search field component
export const SearchField: React.FC<{
  value: string;
  onChange: (value: string) => void;
}> = ({ value, onChange }) => (
  <TextField
    placeholder="Search files..."
    value={value}
    onChange={(e) => onChange(e.target.value)}
    size="small"
    sx={{ minWidth: 250, flexGrow: 1 }}
    InputProps={{
      startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
      endAdornment: value && (
        <IconButton size="small" onClick={() => onChange('')}>
          <ClearIcon fontSize="small" />
        </IconButton>
      ),
    }}
  />
);

// Project filter component
export const ProjectFilter: React.FC<{
  value: string;
  projects: Project[];
  onChange: (event: SelectChangeEvent) => void;
}> = ({ value, projects, onChange }) => (
  <FormControl size="small" sx={{ minWidth: 150 }}>
    <InputLabel>Project</InputLabel>
    <Select value={value} label="Project" onChange={onChange}>
      <MenuItem value="">All Projects</MenuItem>
      {projects.map((project) => (
        <MenuItem key={project.id} value={project.id}>
          {project.name}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

// Folder filter component
export const FolderFilter: React.FC<{
  value: string;
  folders: Folder[];
  onChange: (event: SelectChangeEvent) => void;
}> = ({ value, folders, onChange }) => (
  <FormControl size="small" sx={{ minWidth: 150 }}>
    <InputLabel>Folder</InputLabel>
    <Select value={value} label="Folder" onChange={onChange}>
      <MenuItem value="">All Folders</MenuItem>
      <MenuItem value="unorganized">Unorganized</MenuItem>
      {folders.map((folder) => (
        <MenuItem key={folder.id} value={folder.id}>
          <FolderMenuItem folder={folder} />
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

// Filter toggle component
export const FilterToggle: React.FC<{
  expanded: boolean;
  activeFiltersCount: number;
  onToggle: () => void;
  onClearFilters: () => void;
}> = ({ expanded, activeFiltersCount, onToggle, onClearFilters }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <IconButton
      onClick={onToggle}
      size="small"
      color={activeFiltersCount > 2 ? 'primary' : 'default'}
    >
      <FilterIcon />
      {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
    </IconButton>
    
    {activeFiltersCount > 0 && (
      <Chip
        label={`${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''}`}
        size="small"
        color="primary"
        onDelete={onClearFilters}
        deleteIcon={<ClearIcon />}
      />
    )}
  </Box>
);

// Advanced filter select component
export const AdvancedFilterSelect: React.FC<{
  label: string;
  value: string;
  onChange: (event: SelectChangeEvent) => void;
  children: React.ReactNode;
}> = ({ label, value, onChange, children }) => (
  <FormControl size="small" sx={{ minWidth: 150 }}>
    <InputLabel>{label}</InputLabel>
    <Select value={value} label={label} onChange={onChange}>
      {children}
    </Select>
  </FormControl>
);