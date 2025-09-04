import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { Folder as FolderIcon, Refresh as RefreshIcon } from "@mui/icons-material";

interface FileFolderHeaderProps {
  onRefresh?: () => Promise<void>;
}

export const FileFolderHeader: React.FC<FileFolderHeaderProps> = ({ onRefresh }) => (
  <Box sx={{ 
    p: 2, 
    borderBottom: 1, 
    borderColor: "divider", 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center" 
  }}>
    <Box>
      <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <FolderIcon />
        Folder View
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Files organized by folders and projects
      </Typography>
    </Box>
    {onRefresh && (
      <Button
        variant="outlined"
        size="small"
        startIcon={<RefreshIcon />}
        onClick={onRefresh}
      >
        Refresh
      </Button>
    )}
  </Box>
);
