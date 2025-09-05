import React from 'react';
import { useParams } from 'react-router-dom';
import { Container, Box, Typography } from '@mui/material';
import { AssetDocumentView } from '../components/file-management/AssetDocumentView/AssetDocumentView';

export const AssetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" gutterBottom color="error">
            Asset ID not provided
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Asset Documents
        </Typography>
        <AssetDocumentView preSelectedAssetId={id} />
      </Box>
    </Container>
  );
};