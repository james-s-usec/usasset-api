// Helper components and functions for FileFilterBar
import React from 'react';
import { MenuItem, Box, Chip, Typography } from '@mui/material';
import type { FileData } from './types';
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

// File type extraction with reduced complexity
const MIMETYPE_MAP: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.ms-excel': 'XLS',
};

const MIMETYPE_PATTERNS = [
  { pattern: 'wordprocessingml.document', type: 'DOCX' },
  { pattern: 'presentationml.presentation', type: 'PPTX' },
  { pattern: 'spreadsheetml.sheet', type: 'XLSX' },
  { pattern: 'csv', type: 'CSV' },
  { pattern: 'zip', type: 'Archive' },
];

const MIMETYPE_PREFIXES = [
  { prefix: 'image/', type: 'Image' },
  { prefix: 'video/', type: 'Video' },
  { prefix: 'audio/', type: 'Audio' },
];

export const getFileTypeFromMimetype = (mimetype: string): string => {
  // Check exact matches
  if (MIMETYPE_MAP[mimetype]) return MIMETYPE_MAP[mimetype];
  
  // Check patterns
  for (const { pattern, type } of MIMETYPE_PATTERNS) {
    if (mimetype.includes(pattern)) return type;
  }
  
  // Check prefixes
  for (const { prefix, type } of MIMETYPE_PREFIXES) {
    if (mimetype.startsWith(prefix)) return type;
  }
  
  return 'Other';
};

export const getUniqueFileTypes = (files: FileData[]): Array<{ value: string; label: string; count: number }> => {
  const typeCounts = new Map<string, number>();
  
  files.forEach(file => {
    const type = getFileTypeFromMimetype(file.mimetype);
    typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
  });
  
  return Array.from(typeCounts.entries())
    .map(([type, count]) => ({ value: type, label: type, count }))
    .sort((a, b) => b.count - a.count);
};

export const getActiveFiltersCount = (filters: FileFilters): number => {
  let count = 0;
  if (filters.search) count++;
  if (filters.projectId) count++;
  if (filters.folderId) count++;
  if (filters.fileType) count++;
  if (filters.dateRange !== 'all') count++;
  if (filters.sizeRange !== 'all') count++;
  return count;
};

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

// Filter chip component
export const FilterChip: React.FC<{ label: string }> = ({ label }) => (
  <Chip label={label} size="small" sx={{ ml: 1, mb: 0.5 }} />
);

// Filter summary component
export const FilterSummary: React.FC<{
  filters: FileFilters;
  projects: Project[];
  folders: Folder[];
}> = ({ filters, projects, folders }) => {
  const getProjectName = (id: string) => projects.find(p => p.id === id)?.name || 'Unknown';
  const getFolderName = (id: string) => {
    if (id === 'unorganized') return 'Unorganized';
    return folders.find(f => f.id === id)?.name || 'Unknown';
  };
  
  return (
    <Typography variant="body2" color="text.secondary">
      Filters applied:
      {filters.search && <FilterChip label={`Search: "${filters.search}"`} />}
      {filters.projectId && <FilterChip label={`Project: ${getProjectName(filters.projectId)}`} />}
      {filters.folderId && <FilterChip label={`Folder: ${getFolderName(filters.folderId)}`} />}
      {filters.fileType && <FilterChip label={`Type: ${filters.fileType}`} />}
      {filters.dateRange !== 'all' && <FilterChip label={`Date: ${filters.dateRange}`} />}
      {filters.sizeRange !== 'all' && <FilterChip label={`Size: ${filters.sizeRange}`} />}
    </Typography>
  );
};

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