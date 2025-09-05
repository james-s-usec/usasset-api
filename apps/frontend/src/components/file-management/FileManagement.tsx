import React, { useEffect, useState, useMemo } from "react";
import { Box, Alert } from "@mui/material";
import { type FileFilters } from "./FileFilterBar";
import { useFileManagement } from "./useFileManagement";
import { applyFilters, createDefaultFilters } from "./fileFilters";
import { FileManagementHeader } from "./components/FileManagementHeader";
import { FileManagementContent } from "./components/FileManagementContent";
import { useProjects } from "./components/useProjects";

const LoadingView: React.FC = () => <Box>Loading...</Box>;

const ErrorAlert: React.FC<{ error: string; onClose: () => void }> = ({ error, onClose }) => (
  <Alert severity="error" sx={{ mb: 2 }} onClose={onClose}>
    {error}
  </Alert>
);

type ViewMode = "table" | "tree" | "folders" | "assets";

const FileManagementView: React.FC<{
  state: ReturnType<typeof useFileManagement>;
  projects: ReturnType<typeof useProjects>['projects'];
  viewMode: ViewMode;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
  filteredFiles: ReturnType<typeof applyFilters>;
  filters: FileFilters;
  setFilters: React.Dispatch<React.SetStateAction<FileFilters>>;
  handleClearFilters: () => void;
}> = ({ state, projects, viewMode, setViewMode, filteredFiles, filters, setFilters, handleClearFilters }) => (
  <Box>
    <FileManagementHeader viewMode={viewMode} onViewModeChange={setViewMode} />
    {state.error && (
      <ErrorAlert error={state.error} onClose={() => state.setError(null)} />
    )}
    <FileManagementContent
      state={state}
      projects={projects}
      viewMode={viewMode}
      filteredFiles={filteredFiles}
      filters={filters}
      onFiltersChange={setFilters}
      onClearFilters={handleClearFilters}
    />
  </Box>
);

export const FileManagement: React.FC = () => {
  const state = useFileManagement();
  const { loadFiles } = state;
  const { projects } = useProjects(state.fetchProjects);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [filters, setFilters] = useState<FileFilters>(createDefaultFilters());
  
  const filteredFiles = useMemo(() => applyFilters(state.files, filters), [state.files, filters]);
  const handleClearFilters = (): void => setFilters(createDefaultFilters());
  
  useEffect((): void => { loadFiles(); }, [loadFiles]);
  
  if (state.loading) return <LoadingView />;
  
  return (
    <FileManagementView {...{
      state, projects, viewMode, setViewMode, 
      filteredFiles, filters, setFilters, handleClearFilters
    }} />
  );
};
