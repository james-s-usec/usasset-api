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

const AssetManagementContent: React.FC<AssetManagementContentProps> = (props) => (
  <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <AssetTableHeader 
      onAdd={props.onAdd}
      onRefresh={props.onRefresh} 
      loading={props.loading}
      categories={props.categories}
      onUpdateCategories={props.onUpdateCategories}
    />
    {props.error && <Alert severity="error" sx={{ mb: 2 }}>{props.error}</Alert>}
    <SelectionToolbar
      selectedAssets={props.selectedAssets}
      onSelectAll={props.onSelectAll}
      onClearSelection={props.onClearSelection}
      onBulkEdit={props.onBulkEdit}
      onBulkDelete={props.onBulkDelete}
    />
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
      <AssetGrid
        assets={props.assets}
        columnDefs={props.columnDefs}
        components={props.components}
        loading={props.loading}
        error={props.error}
        onGridReady={props.onGridReady}
        onSelectionChanged={props.onSelectionChanged}
      />
    </Box>
  </Box>
);

// Helper functions for bulk operations
const confirmBulkDelete = (count: number): boolean => {
  const confirmMessage = `Are you sure you want to delete ${count} asset${count > 1 ? 's' : ''}?`;
  return window.confirm(confirmMessage);
};

const showBulkResult = (result: { successful: number; failed: number }, action: string): void => {
  const message = result.failed > 0
    ? `Partially completed: ${result.successful} ${action} successfully, ${result.failed} failed.`
    : `Successfully ${action} ${result.successful} asset${result.successful > 1 ? 's' : ''}`;
  alert(message);
};

const showError = (action: string, err: unknown): void => {
  alert(`Error ${action} assets: ` + (err instanceof Error ? err.message : 'Unknown error'));
};

// Bulk operations handlers
interface BulkHandlerDeps {
  selectedAssets: Asset[];
  bulkUpdateAssets: (updates: Partial<Asset>, ids: string[]) => Promise<{ successful: number; failed: number }>;
  bulkDeleteAssets: (ids: string[]) => Promise<{ successful: number; failed: number }>;
  clearSelection: () => void;
  setBulkEditModalOpen: (open: boolean) => void;
}

const createBulkHandlers = (deps: BulkHandlerDeps): {
  handleBulkEdit: () => void;
  handleBulkDelete: (assets: Asset[]) => Promise<void>;
  handleBulkEditSave: (updates: Partial<Asset>) => Promise<void>;
} => ({
  handleBulkEdit: (): void => deps.setBulkEditModalOpen(true),
  handleBulkDelete: async (assets: Asset[]): Promise<void> => {
    if (!confirmBulkDelete(assets.length)) return;
    try {
      const result = await deps.bulkDeleteAssets(assets.map(asset => asset.id));
      deps.clearSelection();
      showBulkResult(result, 'deleted');
    } catch (err) {
      showError('deleting', err);
    }
  },
  handleBulkEditSave: async (updates: Partial<Asset>): Promise<void> => {
    try {
      const result = await deps.bulkUpdateAssets(updates, deps.selectedAssets.map(asset => asset.id));
      deps.setBulkEditModalOpen(false);
      deps.clearSelection();
      showBulkResult(result, 'updated');
    } catch (err) {
      showError('updating', err);
    }
  }
});

// Custom hook for bulk operations logic
const useBulkOperations = (
  selectedAssets: Asset[],
  bulkUpdateAssets: (updates: Partial<Asset>, ids: string[]) => Promise<{ successful: number; failed: number }>,
  bulkDeleteAssets: (ids: string[]) => Promise<{ successful: number; failed: number }>,
  clearSelection: () => void
): {
  bulkEditModalOpen: boolean;
  setBulkEditModalOpen: (open: boolean) => void;
  handleBulkEdit: () => void;
  handleBulkDelete: (assets: Asset[]) => Promise<void>;
  handleBulkEditSave: (updates: Partial<Asset>) => Promise<void>;
} => {
  const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);
  const handlers = createBulkHandlers({
    selectedAssets,
    bulkUpdateAssets,
    bulkDeleteAssets,
    clearSelection,
    setBulkEditModalOpen
  });
  return { bulkEditModalOpen, setBulkEditModalOpen, ...handlers };
};

// Main component extracted logic
const useAssetGridMain = (): {
  assets: Asset[];
  loading: boolean;
  error: string | null;
  fetchAssets: () => void;
  gridLogic: ReturnType<typeof useAssetGridLogic>;
  bulkOps: ReturnType<typeof useBulkOperations>;
} => {
  const { assets, loading, error, fetchAssets, deleteAsset, bulkUpdateAssets, bulkDeleteAssets } = useAssets();
  const navigate = useNavigate();
  
  const handleViewDocuments = (asset: Asset): void => {
    navigate(`/assets/${asset.id}`);
  };

  const gridLogic = useAssetGridLogic({
    onEdit: (asset: Asset) => alert(`Edit ${asset.name} coming soon!`),
    onDelete: deleteAsset,
    onViewDocuments: handleViewDocuments,
  });

  const bulkOps = useBulkOperations(
    gridLogic.selectedAssets, 
    bulkUpdateAssets, 
    bulkDeleteAssets, 
    gridLogic.clearSelection
  );

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  return { assets, loading, error, fetchAssets, gridLogic, bulkOps };
};

const MainGrid: React.FC<{
  data: ReturnType<typeof useAssetGridMain>;
  handleAdd: () => void;
}> = ({ data, handleAdd }) => (
  <>
    <AssetManagementContent
      assets={data.assets}
      loading={data.loading}
      error={data.error}
      columnDefs={data.gridLogic.columnDefs}
      components={data.gridLogic.components}
      onGridReady={data.gridLogic.onGridReady}
      onSelectionChanged={data.gridLogic.onSelectionChanged}
      onAdd={handleAdd}
      onRefresh={data.fetchAssets}
      categories={data.gridLogic.categories}
      onUpdateCategories={data.gridLogic.updateCategories}
      selectedAssets={data.gridLogic.selectedAssets}
      onSelectAll={data.gridLogic.selectAll}
      onClearSelection={data.gridLogic.clearSelection}
      onBulkEdit={data.bulkOps.handleBulkEdit}
      onBulkDelete={data.bulkOps.handleBulkDelete}
    />
    <BulkEditModal
      open={data.bulkOps.bulkEditModalOpen}
      selectedAssets={data.gridLogic.selectedAssets}
      onClose={() => data.bulkOps.setBulkEditModalOpen(false)}
      onSave={data.bulkOps.handleBulkEditSave}
    />
  </>
);

export const AssetGridManagement: React.FC = () => {
  const data = useAssetGridMain();
  const handleAdd = (): void => alert('Add asset functionality coming soon!');
  return <MainGrid data={data} handleAdd={handleAdd} />;
};