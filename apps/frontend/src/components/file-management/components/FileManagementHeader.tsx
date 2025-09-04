import React from "react";
import { Box, Typography, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { TableChart as TableIcon, AccountTree as TreeIcon, Folder as FolderViewIcon } from "@mui/icons-material";

type ViewMode = "table" | "tree" | "folders";

interface FileManagementHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const FileManagementHeader: React.FC<FileManagementHeaderProps> = ({
  viewMode,
  onViewModeChange,
}) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
    <Typography variant="h4">File Management</Typography>
    <ToggleButtonGroup
      value={viewMode}
      exclusive
      onChange={(_, newMode) => newMode && onViewModeChange(newMode)}
      size="small"
    >
      <ToggleButton value="table" aria-label="table view">
        <TableIcon />
        Table
      </ToggleButton>
      <ToggleButton value="tree" aria-label="tree view">
        <TreeIcon />
        Tree
      </ToggleButton>
      <ToggleButton value="folders" aria-label="folder view">
        <FolderViewIcon />
        Folders
      </ToggleButton>
    </ToggleButtonGroup>
  </Box>
);
