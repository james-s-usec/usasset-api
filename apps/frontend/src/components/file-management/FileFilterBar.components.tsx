// Filter components extracted from FileFilterBar
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

// Folder menu item component
export const FolderMenuItem: React.FC<{ folder: Folder }> = ({ folder }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <Box
      sx={{
        width: 8,
        height: 8,
        borderRadius: 1,
        bgcolor: folder.color || '#gray',
      }}
    />
    {folder.name}
  </Box>
);

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

// Filter chip component
export const FilterChip: React.FC<{ label: string }> = ({ label }) => (
  <Chip label={label} size="small" sx={{ ml: 1, mb: 0.5 }} />
);

// File type menu items
export const FileTypeMenuItems: React.FC<{ 
  fileTypes: Array<{ value: string; label: string; count: number }> 
}> = ({ fileTypes }) => (
  <>
    <MenuItem value="">All Types</MenuItem>
    {fileTypes.map((type) => (
      <MenuItem key={type.value} value={type.value}>
        {type.label} ({type.count})
      </MenuItem>
    ))}
  </>
);

// Date range menu items
export const DateRangeMenuItems: React.FC = () => (
  <>
    <MenuItem value="all">All Time</MenuItem>
    <MenuItem value="today">Today</MenuItem>
    <MenuItem value="week">This Week</MenuItem>
    <MenuItem value="month">This Month</MenuItem>
    <MenuItem value="quarter">This Quarter</MenuItem>
  </>
);

// Size range menu items
export const SizeRangeMenuItems: React.FC = () => (
  <>
    <MenuItem value="all">All Sizes</MenuItem>
    <MenuItem value="small">Small (&lt; 1MB)</MenuItem>
    <MenuItem value="medium">Medium (1-10MB)</MenuItem>
    <MenuItem value="large">Large (&gt; 10MB)</MenuItem>
  </>
);

// Filter summary component
interface FilterSummaryProps {
  filters: {
    search: string;
    projectId: string;
    folderId: string;
    fileType: string;
    dateRange: string;
    sizeRange: string;
  };
  projects: Project[];
  folders: Folder[];
}

export const FilterSummary: React.FC<FilterSummaryProps> = ({ filters, projects, folders }) => {
  const getProjectName = (id: string): string => projects.find(p => p.id === id)?.name || 'Unknown';
  const getFolderName = (id: string): string => {
    if (id === 'unorganized') return 'Unorganized';
    return folders.find(f => f.id === id)?.name || 'Unknown';
  };
  
  return (
    <Box component="div">
      <Box component="span" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
        Filters applied:
      </Box>
      {filters.search && <FilterChip label={`Search: "${filters.search}"`} />}
      {filters.projectId && <FilterChip label={`Project: ${getProjectName(filters.projectId)}`} />}
      {filters.folderId && <FilterChip label={`Folder: ${getFolderName(filters.folderId)}`} />}
      {filters.fileType && <FilterChip label={`Type: ${filters.fileType}`} />}
      {filters.dateRange !== 'all' && <FilterChip label={`Date: ${filters.dateRange}`} />}
      {filters.sizeRange !== 'all' && <FilterChip label={`Size: ${filters.sizeRange}`} />}
    </Box>
  );
};