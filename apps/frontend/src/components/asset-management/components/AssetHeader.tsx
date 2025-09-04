import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { Add as AddIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import { ColumnVisibilityControl } from "../ColumnVisibilityControl";
import type { ColumnCategory } from "../columnConfig";

interface AssetHeaderProps {
  columnCategories: ColumnCategory[];
  onCategoryToggle: (categoryId: string) => void;
  onRefresh: () => void;
  onAdd: () => void;
  loading: boolean;
}

export const AssetHeader: React.FC<AssetHeaderProps> = ({
  columnCategories,
  onCategoryToggle,
  onRefresh,
  onAdd,
  loading,
}) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
    <Typography variant="h4" component="h1">
      Asset Management
    </Typography>
    <Box sx={{ display: "flex", gap: 2 }}>
      <ColumnVisibilityControl
        categories={columnCategories}
        onCategoryToggle={onCategoryToggle}
      />
      <Button
        variant="outlined"
        startIcon={<RefreshIcon />}
        onClick={onRefresh}
        disabled={loading}
      >
        Refresh
      </Button>
      <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd}>
        Add Asset
      </Button>
    </Box>
  </Box>
);
