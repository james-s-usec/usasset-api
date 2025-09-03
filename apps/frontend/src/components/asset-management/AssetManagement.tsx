import React, { useEffect } from 'react';
import { Box, Alert } from '@mui/material';
import type { Asset } from './types';
import { useAssets } from './hooks/useAssets';
import { AssetTableHeader } from './AssetTableHeader';
import { AssetTable } from './AssetTable';

export const AssetManagement: React.FC = () => {
  const { assets, loading, error, fetchAssets, deleteAsset } = useAssets();

  const handleAdd = (): void => alert('Add asset functionality coming soon!');
  const handleEdit = (asset: Asset): void => alert(`Edit ${asset.name} coming soon!`);
  const handleDelete = async (id: string): Promise<void> => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      await deleteAsset(id);
    }
  };

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  return (
    <Box>
      <AssetTableHeader 
        onAdd={handleAdd} 
        onRefresh={fetchAssets} 
        loading={loading} 
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <AssetTable 
        assets={assets} 
        loading={loading} 
        onEdit={handleEdit} 
        onDelete={handleDelete} 
      />
    </Box>
  );
};