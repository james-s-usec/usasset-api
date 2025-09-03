import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';

interface AssetTableHeaderProps {
  onAdd: () => void;
  onRefresh: () => void;
  loading: boolean;
}

export const AssetTableHeader: React.FC<AssetTableHeaderProps> = ({ 
  onAdd, 
  onRefresh, 
  loading 
}) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
    <Typography variant="h4" component="h1">
      Asset Management
    </Typography>
    <Box sx={{ display: 'flex', gap: 2 }}>
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