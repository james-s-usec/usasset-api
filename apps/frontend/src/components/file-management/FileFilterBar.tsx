import React from 'react';
import { Box, Paper, Collapse } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import type { FileData } from './types';
import {
  getUniqueFileTypes,
  getActiveFiltersCount,
} from './fileFilterBar.utils';
import {
  SearchField,
  ProjectFilter,
  FolderFilter,
  FilterToggle,
  AdvancedFilterSelect,
  FilterSummary,
  FileTypeMenuItems,
  DateRangeMenuItems,
  SizeRangeMenuItems,
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

// Filter state logic
const useFilterLogic = (files: FileData[], filters: FileFilters, onFiltersChange: (filters: FileFilters) => void): {
  expanded: boolean;
  fileTypes: Array<{ value: string; label: string; count: number }>;
  activeFiltersCount: number;
  handleSelectChange: (field: keyof FileFilters) => (event: SelectChangeEvent) => void;
  toggleExpanded: () => void;
} => {
  const [expanded, setExpanded] = React.useState(false);
  const fileTypes = getUniqueFileTypes(files);
  const activeFiltersCount = getActiveFiltersCount(filters);

  const handleSelectChange = (field: keyof FileFilters) => 
    (event: SelectChangeEvent): void => {
      onFiltersChange({ ...filters, [field]: event.target.value as string });
    };

  const toggleExpanded = (): void => setExpanded(!expanded);

  return { expanded, fileTypes, activeFiltersCount, handleSelectChange, toggleExpanded };
};

// Expanded section component
const ExpandedFilters: React.FC<{
  filters: FileFilters;
  fileTypes: Array<{ value: string; label: string; count: number }>;
  projects?: Project[];
  folders?: Folder[];
  onSelectChange: (field: keyof FileFilters) => (event: SelectChangeEvent) => void;
}> = ({ filters, fileTypes, projects, folders, onSelectChange }) => {
  const activeFiltersCount = getActiveFiltersCount(filters);
  
  return (
    <>
      <AdvancedFilters
        filters={filters}
        fileTypes={fileTypes}
        onSelectChange={onSelectChange}
      />
      {activeFiltersCount > 0 && (
        <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider', mt: 2 }}>
          <FilterSummary filters={filters} projects={projects || []} folders={folders || []} />
        </Box>
      )}
    </>
  );
};

// Main rendering component
const FileFilterBarContent: React.FC<FileFilterBarProps & {
  expanded: boolean;
  fileTypes: Array<{ value: string; label: string; count: number }>;
  activeFiltersCount: number;
  handleSelectChange: (field: keyof FileFilters) => (event: SelectChangeEvent) => void;
  toggleExpanded: () => void;
}> = (props) => (
  <Paper sx={{ p: 2, mb: 2 }}>
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
      <QuickFilters
        filters={props.filters}
        projects={props.projects}
        folders={props.folders}
        onFiltersChange={props.onFiltersChange}
        onSelectChange={props.handleSelectChange}
      />
      <FilterToggle
        expanded={props.expanded}
        activeFiltersCount={props.activeFiltersCount}
        onToggle={props.toggleExpanded}
        onClearFilters={props.onClearFilters}
      />
    </Box>
    <Collapse in={props.expanded}>
      <ExpandedFilters
        filters={props.filters}
        fileTypes={props.fileTypes}
        projects={props.projects || []}
        folders={props.folders || []}
        onSelectChange={props.handleSelectChange}
      />
    </Collapse>
  </Paper>
);

// Main component - simplified
export const FileFilterBar: React.FC<FileFilterBarProps> = (props) => {
  const logic = useFilterLogic(props.files, props.filters, props.onFiltersChange);
  return <FileFilterBarContent {...props} {...logic} />;
};