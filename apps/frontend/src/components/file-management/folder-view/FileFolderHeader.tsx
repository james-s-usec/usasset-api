import React from "react";
import { Box, Typography, Button, ButtonGroup } from "@mui/material";
import { 
  Folder as FolderIcon, 
  Refresh as RefreshIcon, 
  Add as AddIcon,
  FolderOpen as ManageFoldersIcon 
} from "@mui/icons-material";

interface FileFolderHeaderProps {
  onRefresh?: () => Promise<void>;
  onCreateFolder?: () => void;
  onManageFolders?: () => void;
}

const HeaderTitle: React.FC = () => (
  <Box>
    <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <FolderIcon />
      Folder View
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Files organized by folders and projects
    </Typography>
  </Box>
);

const HeaderActions: React.FC<{
  onRefresh?: () => Promise<void>;
  onCreateFolder?: () => void;
  onManageFolders?: () => void;
}> = ({ onRefresh, onCreateFolder, onManageFolders }) => (
  <ButtonGroup size="small" variant="outlined">
    {onCreateFolder && (
      <Button startIcon={<AddIcon />} onClick={onCreateFolder}>
        New Folder
      </Button>
    )}
    {onManageFolders && (
      <Button startIcon={<ManageFoldersIcon />} onClick={onManageFolders}>
        Manage
      </Button>
    )}
    {onRefresh && (
      <Button startIcon={<RefreshIcon />} onClick={onRefresh}>
        Refresh
      </Button>
    )}
  </ButtonGroup>
);

export const FileFolderHeader: React.FC<FileFolderHeaderProps> = (props) => (
  <Box sx={{ 
    p: 2, 
    borderBottom: 1, 
    borderColor: "divider", 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center" 
  }}>
    <HeaderTitle />
    <HeaderActions {...props} />
  </Box>
);
