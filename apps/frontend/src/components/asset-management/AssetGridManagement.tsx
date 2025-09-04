import React, { useEffect } from 'react';
import { Box, Alert } from '@mui/material';
import type { Asset } from './types';
import { useAssets } from './hooks/useAssets';
import { AssetTableHeader } from './AssetTableHeader';
import { AssetGrid } from './components/AssetGrid';
import { useAssetGridLogic } from './hooks/useAssetGridLogic';

export const AssetGridManagement: React.FC = () => {
  const { assets, loading, error, fetchAssets, deleteAsset } = useAssets();
  const { columnDefs, components, onGridReady } = useAssetGridLogic({
    onEdit: (asset: Asset) => alert(`Edit ${asset.name} coming soon!`),
    onDelete: deleteAsset,
  });

  const handleAdd = (): void => alert('Add asset functionality coming soon!');

  useEffect(() => { 
    fetchAssets(); 
  }, [fetchAssets]);

  return (
    <Box>
      <AssetTableHeader 
        onAdd={handleAdd} 
        onRefresh={fetchAssets} 
        loading={loading} 
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <AssetGrid
        assets={assets}
        columnDefs={columnDefs}
        components={components}
        loading={loading}
        error={error}
        onGridReady={onGridReady}
      />
    </Box>
  );
};