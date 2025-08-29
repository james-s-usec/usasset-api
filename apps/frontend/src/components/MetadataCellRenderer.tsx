import React from 'react';
import type { ICellRendererParams } from 'ag-grid-community';
import { Box, Typography, IconButton } from '@mui/material';
import { Visibility } from '@mui/icons-material';

export interface MetadataCellRendererProps extends ICellRendererParams {
  onViewMetadata: (data: unknown, title: string) => void;
}

export const MetadataCellRenderer = (params: MetadataCellRendererProps): React.ReactElement | string => {
  if (!params.value) return '';
  
  const handleViewMetadata = (): void => {
    params.onViewMetadata(params.value, `Metadata for ${params.data.correlation_id}`);
  };

  const metadata = params.value as Record<string, unknown>;
  const preview = metadata.source ? 
    `${metadata.source} (+${Object.keys(metadata).length - 1} keys)` :
    `${Object.keys(metadata).length} keys`;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '11px' }}>
        {preview}
      </Typography>
      <IconButton 
        size="small" 
        onClick={handleViewMetadata}
        sx={{ p: 0.25 }}
        title="View full metadata"
      >
        <Visibility fontSize="small" />
      </IconButton>
    </Box>
  );
};