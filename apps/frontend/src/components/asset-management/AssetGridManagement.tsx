import React, { useEffect, useState } from 'react';
import { Box, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { ColDef, GridReadyEvent, ICellRendererParams } from 'ag-grid-community';
import type { Asset } from './types';
import type { ColumnCategory } from './columnConfig';
import { useAssets } from './hooks/useAssets';
import { AssetTableHeader } from './AssetTableHeader';
import { AssetGrid } from './components/AssetGrid';
import { SelectionToolbar } from './components/SelectionToolbar';
import { BulkEditModal } from './components/BulkEditModal';
import { useAssetGridLogic } from './hooks/useAssetGridLogic';
import './styles/column-categories.css';

interface AssetManagementContentProps {
  assets: Asset[];
  loading: boolean;
  error: string | null;
  columnDefs: ColDef[];
  components: {
    actionsRenderer: (params: ICellRendererParams<Asset>) => React.ReactElement;
    statusRenderer: (params: ICellRendererParams) => React.ReactElement;
  };
  onGridReady: (params: GridReadyEvent) => void;
  onSelectionChanged: (selectedAssets: Asset[]) => void;
  onAdd: () => void;
  onRefresh: () => void;
  categories: ColumnCategory[];
  onUpdateCategories: (categories: ColumnCategory[]) => void;
  selectedAssets: Asset[];
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkEdit: (assets: Asset[]) => void;
  onBulkDelete: (assets: Asset[]) => void;
}

const AssetManagementContent: React.FC<AssetManagementContentProps> = (props) => {
  const {
    assets, loading, error, columnDefs, components, onGridReady, onSelectionChanged,
    onAdd, onRefresh, categories, onUpdateCategories, selectedAssets,
    onSelectAll, onClearSelection, onBulkEdit, onBulkDelete
  } = props;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <AssetTableHeader 
        onAdd={onAdd}
        onRefresh={onRefresh} 
        loading={loading}
        categories={categories}
        onUpdateCategories={onUpdateCategories}
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <SelectionToolbar
        selectedAssets={selectedAssets}
        onSelectAll={onSelectAll}
        onClearSelection={onClearSelection}
        onBulkEdit={onBulkEdit}
        onBulkDelete={onBulkDelete}
      />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <AssetGrid
          assets={assets}
          columnDefs={columnDefs}
          components={components}
          loading={loading}
          error={error}
          onGridReady={onGridReady}
          onSelectionChanged={onSelectionChanged}
        />
      </Box>
    </Box>
  );
};

// Custom hook for bulk operations logic
const useBulkOperations = (
  selectedAssets: Asset[],
  bulkUpdateAssets: (updates: Partial<Asset>, ids: string[]) => Promise<{ successful: number; failed: number }>,
  bulkDeleteAssets: (ids: string[]) => Promise<{ successful: number; failed: number }>,
  clearSelection: () => void
) => {
  const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);

  const handleBulkEdit = (): void => {
    setBulkEditModalOpen(true);
  };

  const handleBulkDelete = async (assets: Asset[]): Promise<void> => {
    const confirmMessage = `Are you sure you want to delete ${assets.length} asset${assets.length > 1 ? 's' : ''}?`;
    if (!window.confirm(confirmMessage)) return;

    try {
      const result = await bulkDeleteAssets(assets.map(asset => asset.id));
      clearSelection();
      
      const message = result.failed > 0
        ? `Partially completed: ${result.successful} deleted successfully, ${result.failed} failed.`
        : `Successfully deleted ${result.successful} asset${result.successful > 1 ? 's' : ''}`;
      alert(message);
    } catch (err) {
      alert('Error deleting assets: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleBulkEditSave = async (updates: Partial<Asset>): Promise<void> => {
    try {
      const assetIds = selectedAssets.map(asset => asset.id);
      const result = await bulkUpdateAssets(updates, assetIds);
      
      setBulkEditModalOpen(false);
      clearSelection();
      
      const message = result.failed > 0
        ? `Partially completed: ${result.successful} updated successfully, ${result.failed} failed.`
        : `Successfully updated ${result.successful} asset${result.successful > 1 ? 's' : ''}`;
      alert(message);
    } catch (err) {
      alert('Error updating assets: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  return {
    bulkEditModalOpen,
    setBulkEditModalOpen,
    handleBulkEdit,
    handleBulkDelete,
    handleBulkEditSave
  };
};

export const AssetGridManagement: React.FC = () => {
  const { assets, loading, error, fetchAssets, deleteAsset, bulkUpdateAssets, bulkDeleteAssets } = useAssets();
  const navigate = useNavigate();
  
  const handleViewDocuments = (asset: Asset): void => {
    navigate(`/assets/${asset.id}`);
  };

  const { 
    columnDefs, components, onGridReady, categories, updateCategories,
    selectedAssets, onSelectionChanged, selectAll, clearSelection
  } = useAssetGridLogic({
    onEdit: (asset: Asset) => alert(`Edit ${asset.name} coming soon!`),
    onDelete: deleteAsset,
    onViewDocuments: handleViewDocuments,
  });

  const {
    bulkEditModalOpen,
    setBulkEditModalOpen,
    handleBulkEdit,
    handleBulkDelete,
    handleBulkEditSave
  } = useBulkOperations(selectedAssets, bulkUpdateAssets, bulkDeleteAssets, clearSelection);

  const handleAdd = (): void => alert('Add asset functionality coming soon!');

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  return (
    <>
      <AssetManagementContent
        assets={assets}
        loading={loading}
        error={error}
        columnDefs={columnDefs}
        components={components}
        onGridReady={onGridReady}
        onSelectionChanged={onSelectionChanged}
        onAdd={handleAdd}
        onRefresh={fetchAssets}
        categories={categories}
        onUpdateCategories={updateCategories}
        selectedAssets={selectedAssets}
        onSelectAll={selectAll}
        onClearSelection={clearSelection}
        onBulkEdit={handleBulkEdit}
        onBulkDelete={handleBulkDelete}
      />
      
      <BulkEditModal
        open={bulkEditModalOpen}
        selectedAssets={selectedAssets}
        onClose={() => setBulkEditModalOpen(false)}
        onSave={handleBulkEditSave}
      />
    </>
  );
};