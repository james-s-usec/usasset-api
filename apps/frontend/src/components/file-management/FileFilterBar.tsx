import React from 'react';
import {
  Box,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Typography,
  IconButton,
  Collapse,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import type { FileData } from './types';

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

export interface FileFilters {
  search: string;
  projectId: string;
  folderId: string;
  fileType: string;
  dateRange: 'all' | 'today' | 'week' | 'month' | 'quarter';
  sizeRange: 'all' | 'small' | 'medium' | 'large';
}

interface FileFilterBarProps {
  files: FileData[];
  folders: Folder[];
  projects: Project[];
  filters: FileFilters;
  onFiltersChange: (filters: FileFilters) => void;
  onClearFilters: () => void;
}

const getUniqueFileTypes = (files: FileData[]): Array<{ value: string; label: string; count: number }> => {
  const typeCounts = new Map<string, number>();
  
  files.forEach(file => {
    const type = getFileTypeFromMimetype(file.mimetype);
    typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
  });
  
  return Array.from(typeCounts.entries())
    .map(([type, count]) => ({ value: type, label: type, count }))
    .sort((a, b) => b.count - a.count);
};

const getFileTypeFromMimetype = (mimetype: string): string => {
  if (mimetype === 'application/pdf') return 'PDF';
  if (mimetype.includes('wordprocessingml.document')) return 'DOCX';
  if (mimetype.includes('presentationml.presentation')) return 'PPTX';
  if (mimetype.includes('spreadsheetml.sheet')) return 'XLSX';
  if (mimetype === 'application/msword') return 'DOC';
  if (mimetype === 'application/vnd.ms-excel') return 'XLS';
  if (mimetype.includes('csv')) return 'CSV';
  if (mimetype.startsWith('image/')) return 'Image';
  if (mimetype.startsWith('video/')) return 'Video';
  if (mimetype.startsWith('audio/')) return 'Audio';
  if (mimetype.includes('zip')) return 'Archive';
  return 'Other';
};

const getActiveFiltersCount = (filters: FileFilters): number => {
  let count = 0;
  if (filters.search) count++;
  if (filters.projectId) count++;
  if (filters.folderId) count++;
  if (filters.fileType) count++;
  if (filters.dateRange !== 'all') count++;
  if (filters.sizeRange !== 'all') count++;
  return count;
};

export const FileFilterBar: React.FC<FileFilterBarProps> = ({
  files,
  folders,
  projects,
  filters,
  onFiltersChange,
  onClearFilters,
}) => {
  const [expanded, setExpanded] = React.useState(false);
  const fileTypes = getUniqueFileTypes(files);
  const activeFiltersCount = getActiveFiltersCount(filters);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, search: event.target.value });
  };

  const handleSelectChange = (field: keyof FileFilters) => (event: SelectChangeEvent) => {
    onFiltersChange({ ...filters, [field]: event.target.value as string });
  };

  const handleToggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      {/* Search and Quick Filters */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search Field */}
        <TextField
          placeholder="Search files..."
          value={filters.search}
          onChange={handleSearchChange}
          size="small"
          sx={{ minWidth: 250, flexGrow: 1 }}
          InputProps={{
            startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
            endAdornment: filters.search && (
              <IconButton
                size="small"
                onClick={() => onFiltersChange({ ...filters, search: '' })}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            ),
          }}
        />

        {/* Quick Project Filter */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Project</InputLabel>
          <Select
            value={filters.projectId}
            label="Project"
            onChange={handleSelectChange('projectId')}
          >
            <MenuItem value="">All Projects</MenuItem>
            {projects.map((project) => (
              <MenuItem key={project.id} value={project.id}>
                {project.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Quick Folder Filter */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Folder</InputLabel>
          <Select
            value={filters.folderId}
            label="Folder"
            onChange={handleSelectChange('folderId')}
          >
            <MenuItem value="">All Folders</MenuItem>
            <MenuItem value="unorganized">Unorganized</MenuItem>
            {folders.map((folder) => (
              <MenuItem key={folder.id} value={folder.id}>
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
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Advanced Filters Toggle */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            onClick={handleToggleExpanded}
            size="small"
            color={activeFiltersCount > 2 ? 'primary' : 'default'}
          >
            <FilterIcon />
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
          
          {/* Active Filters Indicator */}
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
      </Box>

      {/* Advanced Filters */}
      <Collapse in={expanded}>
        <Box sx={{ pt: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* File Type Filter */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>File Type</InputLabel>
            <Select
              value={filters.fileType}
              label="File Type"
              onChange={handleSelectChange('fileType')}
            >
              <MenuItem value="">All Types</MenuItem>
              {fileTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label} ({type.count})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Date Range Filter */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Upload Date</InputLabel>
            <Select
              value={filters.dateRange}
              label="Upload Date"
              onChange={handleSelectChange('dateRange')}
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="quarter">This Quarter</MenuItem>
            </Select>
          </FormControl>

          {/* File Size Filter */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>File Size</InputLabel>
            <Select
              value={filters.sizeRange}
              label="File Size"
              onChange={handleSelectChange('sizeRange')}
            >
              <MenuItem value="all">All Sizes</MenuItem>
              <MenuItem value="small">Small (&lt; 1MB)</MenuItem>
              <MenuItem value="medium">Medium (1-10MB)</MenuItem>
              <MenuItem value="large">Large (&gt; 10MB)</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Filter Summary */}
        {activeFiltersCount > 0 && (
          <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Filters applied:
              {filters.search && <Chip label={`Search: "${filters.search}"`} size="small" sx={{ ml: 1, mb: 0.5 }} />}
              {filters.projectId && (
                <Chip
                  label={`Project: ${projects.find(p => p.id === filters.projectId)?.name || 'Unknown'}`}
                  size="small"
                  sx={{ ml: 1, mb: 0.5 }}
                />
              )}
              {filters.folderId && (
                <Chip
                  label={`Folder: ${
                    filters.folderId === 'unorganized' 
                      ? 'Unorganized' 
                      : folders.find(f => f.id === filters.folderId)?.name || 'Unknown'
                  }`}
                  size="small"
                  sx={{ ml: 1, mb: 0.5 }}
                />
              )}
              {filters.fileType && <Chip label={`Type: ${filters.fileType}`} size="small" sx={{ ml: 1, mb: 0.5 }} />}
              {filters.dateRange !== 'all' && (
                <Chip label={`Date: ${filters.dateRange}`} size="small" sx={{ ml: 1, mb: 0.5 }} />
              )}
              {filters.sizeRange !== 'all' && (
                <Chip label={`Size: ${filters.sizeRange}`} size="small" sx={{ ml: 1, mb: 0.5 }} />
              )}
            </Typography>
          </Box>
        )}
      </Collapse>
    </Paper>
  );
};