import React from 'react';
import { Container, Box } from '@mui/material';
import { AssetGridManagement } from '../components/asset-management/AssetGridManagement';

export const AssetsPage: React.FC = () => (
  <Container maxWidth="lg">
    <Box sx={{ py: 4 }}>
      <AssetGridManagement />
    </Box>
  </Container>
);