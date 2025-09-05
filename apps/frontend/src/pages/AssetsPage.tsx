import React from 'react';
import { Box } from '@mui/material';
import { AssetGridManagement } from '../components/asset-management/AssetGridManagement';

export const AssetsPage: React.FC = () => (
  <Box sx={{ 
    px: 3, 
    py: 2, 
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  }}>
    <AssetGridManagement />
  </Box>
);