import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { AgGridReact } from 'ag-grid-react';
import type { ICellRendererParams, GridReadyEvent } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import './AssetGrid.css';
import type { Asset } from './types';
import { AssetService } from './assetService';
import { ColumnVisibilityControl } from './ColumnVisibilityControl';
import {
  columnCategories as defaultColumnCategories,
  getEnabledColumns,
  defaultColDef,
  columnTypes,
  type ColumnCategory,
} from './columnConfig';

export const AssetGridManagement: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [columnCategories, setColumnCategories] = useState<ColumnCategory[]>(
    defaultColumnCategories
  );

  const fetchAssets = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await AssetService.getAssets();
      setAssets(response.data.assets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAdd = useCallback((): void => {
    alert('Add asset functionality coming soon!');
  }, []);

  const handleEdit = useCallback((asset: Asset): void => {
    alert(`Edit asset functionality coming soon for ${asset.name}!`);
  }, []);

  const handleDelete = useCallback(async (id: string): Promise<void> => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        await AssetService.deleteAsset(id);
        fetchAssets();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete asset');
      }
    }
  }, [fetchAssets]);

  const handleCategoryToggle = useCallback((categoryId: string) => {
    setColumnCategories(prev => 
      prev.map(cat => 
        cat.id === categoryId ? { ...cat, enabled: !cat.enabled } : cat
      )
    );
  }, []);

  // Actions cell renderer component
  const ActionsCellRenderer = useCallback((params: ICellRendererParams<Asset>) => (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
      <Button 
        size="small" 
        variant="outlined"
        onClick={() => params.data && handleEdit(params.data)}
      >
        Edit
      </Button>
      <Button 
        size="small" 
        variant="outlined" 
        color="error"
        onClick={() => params.data && handleDelete(params.data.id)}
      >
        Delete
      </Button>
    </Box>
  ), [handleEdit, handleDelete]);

  // Status cell renderer component
  const StatusCellRenderer = useCallback((params: ICellRendererParams) => {
    const status = params.value || 'ACTIVE';
    const colors = {
      ACTIVE: '#4caf50',
      MAINTENANCE: '#ff9800',
      RETIRED: '#9e9e9e',
      DISPOSED: '#f44336',
    };
    return (
      <Box 
        sx={{ 
          display: 'inline-flex',
          alignItems: 'center',
          px: 1,
          py: 0.5,
          borderRadius: 1,
          backgroundColor: colors[status as keyof typeof colors] + '20',
          color: colors[status as keyof typeof colors],
          fontSize: '0.75rem',
          fontWeight: 'medium',
        }}
      >
        {status}
      </Box>
    );
  }, []);

  // Generate column definitions based on enabled categories
  const columnDefs = useMemo(() => {
    return getEnabledColumns(columnCategories);
  }, [columnCategories]);

  // Components for AG-Grid
  const components = useMemo(() => ({
    actionsRenderer: ActionsCellRenderer,
    statusRenderer: StatusCellRenderer,
  }), [ActionsCellRenderer, StatusCellRenderer]);

  // Use the imported default column definition

  const handleGridReady = useCallback((params: GridReadyEvent) => {
    params.api.sizeColumnsToFit();
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Asset Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <ColumnVisibilityControl
            categories={columnCategories}
            onCategoryToggle={handleCategoryToggle}
          />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchAssets}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
          >
            Add Asset
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ height: 600, width: '100%' }}>
        <div className="ag-theme-alpine" style={{ height: '100%', width: '100%' }}>
          <AgGridReact
            rowData={assets}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            columnTypes={columnTypes}
            components={components}
            onGridReady={handleGridReady}
            loading={loading}
            pagination={true}
            paginationPageSize={20}
            animateRows={true}
            rowHeight={50}
            suppressDragLeaveHidesColumns={true}
            suppressMakeColumnVisibleAfterUnGroup={true}
            enableRangeSelection={true}
            enableCharts={true}
            theme="legacy"
          />
        </div>
      </Box>
    </Box>
  );
};