import React from "react";
import { Box, Typography, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { 
  TableChart as TableIcon, 
  AccountTree as TreeIcon, 
  Folder as FolderViewIcon,
  Inventory as AssetIcon 
} from "@mui/icons-material";

type ViewMode = "table" | "tree" | "folders" | "assets";

interface FileManagementHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const ViewModeButton: React.FC<{
  value: ViewMode;
  icon: React.ReactElement;
  label: string;
}> = ({ value, icon, label }) => (
  <ToggleButton value={value} aria-label={`${label.toLowerCase()} view`}>
    {icon}
    {label}
  </ToggleButton>
);

const ViewModeToggle: React.FC<{
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}> = ({ viewMode, onViewModeChange }) => (
  <ToggleButtonGroup
    value={viewMode}
    exclusive
    onChange={(_, newMode) => newMode && onViewModeChange(newMode)}
    size="small"
  >
    <ViewModeButton value="table" icon={<TableIcon />} label="Table" />
    <ViewModeButton value="tree" icon={<TreeIcon />} label="Tree" />
    <ViewModeButton value="folders" icon={<FolderViewIcon />} label="Folders" />
    <ViewModeButton value="assets" icon={<AssetIcon />} label="Assets" />
  </ToggleButtonGroup>
);

export const FileManagementHeader: React.FC<FileManagementHeaderProps> = ({
  viewMode,
  onViewModeChange,
}) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
    <Typography variant="h4">File Management</Typography>
    <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
  </Box>
);
