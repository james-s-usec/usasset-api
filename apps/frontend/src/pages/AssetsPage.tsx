import React from 'react';
import { Container, Box } from '@mui/material';
import { AssetManagement } from '../components/asset-management';

export const AssetsPage: React.FC = () => (
  <Container maxWidth="lg">
    <Box sx={{ py: 4 }}>
      <AssetManagement />
    </Box>
  </Container>
);