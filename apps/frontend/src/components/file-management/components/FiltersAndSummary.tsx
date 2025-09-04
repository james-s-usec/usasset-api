import React from "react";
import { Box, Typography } from "@mui/material";
import { FileFilterBar, type FileFilters } from "../FileFilterBar";
import { getFilterSummary } from "../fileFilters";
import type { FileData } from "../types";

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

interface FiltersAndSummaryProps {
  files: FileData[];
  filteredFiles: FileData[];
  folders: Folder[];
  projects: Project[];
  filters: FileFilters;
  onFiltersChange: (filters: FileFilters) => void;
  onClearFilters: () => void;
}

export const FiltersAndSummary: React.FC<FiltersAndSummaryProps> = ({
  files,
  filteredFiles,
  folders,
  projects,
  filters,
  onFiltersChange,
  onClearFilters,
}) => (
  <>
    <FileFilterBar
      files={files}
      folders={folders}
      projects={projects}
      filters={filters}
      onFiltersChange={onFiltersChange}
      onClearFilters={onClearFilters}
    />
    
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {getFilterSummary(files.length, filteredFiles.length, filters)}
      </Typography>
    </Box>
  </>
);
