import React, { useEffect } from 'react';
import { Box, Alert } from '@mui/material';
import type { ColDef, GridReadyEvent } from 'ag-grid-community';
import type { Asset } from './types';
import type { ColumnCategory } from './columnConfig';
import { useAssets } from './hooks/useAssets';
import { AssetTableHeader } from './AssetTableHeader';
import { AssetGrid } from './components/AssetGrid';
import { useAssetGridLogic } from './hooks/useAssetGridLogic';
import './styles/column-categories.css';

const AssetManagementContent: React.FC<{
  assets: Asset[];
  loading: boolean;
  error: string | null;
  columnDefs: ColDef[];
  components: Record<string, any>;
  onGridReady: (params: GridReadyEvent) => void;
  onAdd: () => void;
  onRefresh: () => void;
  categories: ColumnCategory[];
  onUpdateCategories: (categories: ColumnCategory[]) => void;
}> = ({ assets, loading, error, columnDefs, components, onGridReady, onAdd, onRefresh, categories, onUpdateCategories }) => (
  <Box>
    <AssetTableHeader 
      onAdd={onAdd}
      onRefresh={onRefresh} 
      loading={loading}
      categories={categories}
      onUpdateCategories={onUpdateCategories}
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

export const AssetGridManagement: React.FC = () => {
  const { assets, loading, error, fetchAssets, deleteAsset } = useAssets();
  const { columnDefs, components, onGridReady, categories, updateCategories } = useAssetGridLogic({
    onEdit: (asset: Asset) => alert(`Edit ${asset.name} coming soon!`),
    onDelete: deleteAsset,
  });

  const handleAdd = (): void => alert('Add asset functionality coming soon!');

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  return (
    <AssetManagementContent
      assets={assets}
      loading={loading}
      error={error}
      columnDefs={columnDefs}
      components={components}
      onGridReady={onGridReady}
      onAdd={handleAdd}
      onRefresh={fetchAssets}
      categories={categories}
      onUpdateCategories={updateCategories}
    />
  );
};