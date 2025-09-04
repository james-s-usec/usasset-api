import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { ColumnVisibilityControl } from './components/ColumnVisibilityControl';
import type { ColumnCategory } from './columnConfig';

interface AssetTableHeaderProps {
  onAdd: () => void;
  onRefresh: () => void;
  loading: boolean;
  categories?: ColumnCategory[];
  onUpdateCategories?: (categories: ColumnCategory[]) => void;
}

export const AssetTableHeader: React.FC<AssetTableHeaderProps> = ({ 
  onAdd, 
  onRefresh, 
  loading,
  categories,
  onUpdateCategories
}) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
    <Typography variant="h4" component="h1">
      Asset Management
    </Typography>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {categories && onUpdateCategories && (
        <ColumnVisibilityControl 
          categories={categories}
          onUpdateCategories={onUpdateCategories}
        />
      )}
      <Button
        variant="outlined"
        startIcon={<RefreshIcon />}
        onClick={onRefresh}
        disabled={loading}
      >
        Refresh
      </Button>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onAdd}
      >
        Add Asset
      </Button>
    </Box>
  </Box>
);