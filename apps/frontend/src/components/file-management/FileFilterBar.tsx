import React from 'react';
import { Box, Paper, Collapse } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import type { FileData } from './types';
import {
  getUniqueFileTypes,
  getActiveFiltersCount,
  FilterSummary,
  FileTypeMenuItems,
  DateRangeMenuItems,
  SizeRangeMenuItems,
} from './FileFilterBar.helpers';
import {
  SearchField,
  ProjectFilter,
  FolderFilter,
  FilterToggle,
  AdvancedFilterSelect,
} from './FileFilterBar.components';

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

// Quick filters component
const QuickFilters: React.FC<{
  filters: FileFilters;
  projects: Project[];
  folders: Folder[];
  onFiltersChange: (filters: FileFilters) => void;
  onSelectChange: (field: keyof FileFilters) => (event: SelectChangeEvent) => void;
}> = ({ filters, projects, folders, onFiltersChange, onSelectChange }) => (
  <>
    <SearchField
      value={filters.search}
      onChange={(value) => onFiltersChange({ ...filters, search: value })}
    />
    <ProjectFilter
      value={filters.projectId}
      projects={projects}
      onChange={onSelectChange('projectId')}
    />
    <FolderFilter
      value={filters.folderId}
      folders={folders}
      onChange={onSelectChange('folderId')}
    />
  </>
);

// Advanced filters component
const AdvancedFilters: React.FC<{
  filters: FileFilters;
  fileTypes: Array<{ value: string; label: string; count: number }>;
  onSelectChange: (field: keyof FileFilters) => (event: SelectChangeEvent) => void;
}> = ({ filters, fileTypes, onSelectChange }) => (
  <Box sx={{ pt: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
    <AdvancedFilterSelect
      label="File Type"
      value={filters.fileType}
      onChange={onSelectChange('fileType')}
    >
      <FileTypeMenuItems fileTypes={fileTypes} />
    </AdvancedFilterSelect>
    
    <AdvancedFilterSelect
      label="Upload Date"
      value={filters.dateRange}
      onChange={onSelectChange('dateRange')}
    >
      <DateRangeMenuItems />
    </AdvancedFilterSelect>
    
    <AdvancedFilterSelect
      label="File Size"
      value={filters.sizeRange}
      onChange={onSelectChange('sizeRange')}
    >
      <SizeRangeMenuItems />
    </AdvancedFilterSelect>
  </Box>
);

// Main component - simplified
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

  const handleSelectChange = (field: keyof FileFilters) => (event: SelectChangeEvent) => {
    onFiltersChange({ ...filters, [field]: event.target.value as string });
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <QuickFilters
          filters={filters}
          projects={projects}
          folders={folders}
          onFiltersChange={onFiltersChange}
          onSelectChange={handleSelectChange}
        />
        <FilterToggle
          expanded={expanded}
          activeFiltersCount={activeFiltersCount}
          onToggle={() => setExpanded(!expanded)}
          onClearFilters={onClearFilters}
        />
      </Box>
      
      <Collapse in={expanded}>
        <AdvancedFilters
          filters={filters}
          fileTypes={fileTypes}
          onSelectChange={handleSelectChange}
        />
        
        {activeFiltersCount > 0 && (
          <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider', mt: 2 }}>
            <FilterSummary filters={filters} projects={projects} folders={folders} />
          </Box>
        )}
      </Collapse>
    </Paper>
  );
};