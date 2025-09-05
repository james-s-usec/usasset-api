import React from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
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

const HeaderActions: React.FC<{
  onAdd: () => void;
  onRefresh: () => void;
  loading: boolean;
  categories?: ColumnCategory[];
  onUpdateCategories?: (categories: ColumnCategory[]) => void;
}> = ({ onAdd, onRefresh, loading, categories, onUpdateCategories }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    {categories && onUpdateCategories && (
      <ColumnVisibilityControl categories={categories} onUpdateCategories={onUpdateCategories} />
    )}
    <Tooltip title="Refresh Assets">
      <IconButton onClick={onRefresh} disabled={loading} color="primary">
        <RefreshIcon />
      </IconButton>
    </Tooltip>
    <Tooltip title="Add New Asset">
      <IconButton
        onClick={onAdd}
        color="primary"
        sx={{ 
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
          '&:hover': { backgroundColor: 'primary.dark' }
        }}
      >
        <AddIcon />
      </IconButton>
    </Tooltip>
  </Box>
);

export const AssetTableHeader: React.FC<AssetTableHeaderProps> = (props) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
    <Typography variant="h4" component="h1">
      Asset Management
    </Typography>
    <HeaderActions {...props} />
  </Box>
);