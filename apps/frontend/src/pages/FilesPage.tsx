import React from 'react';
import { Container, Box } from '@mui/material';
import { FileManagement } from '../components/file-management';

export const FilesPage: React.FC = () => (
  <Container maxWidth="lg">
    <Box sx={{ py: 4 }}>
      <FileManagement />
    </Box>
  </Container>
);