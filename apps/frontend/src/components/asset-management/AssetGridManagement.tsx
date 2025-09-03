import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import type { Asset } from './types';
import { AssetService } from './assetService';

export const AssetGridManagement: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const columnDefs = useMemo(() => [
    {
      headerName: 'Asset Tag',
      field: 'assetTag',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 120,
      pinned: 'left',
    },
    {
      headerName: 'Name',
      field: 'name',
      sortable: true,
      filter: true,
      flex: 2,
      minWidth: 180,
    },
    {
      headerName: 'Manufacturer',
      field: 'manufacturer',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 130,
      valueFormatter: (params: any) => params.value || '-',
    },
    {
      headerName: 'Model',
      field: 'modelNumber',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 120,
      valueFormatter: (params: any) => params.value || '-',
    },
    {
      headerName: 'Serial Number',
      field: 'serialNumber',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 130,
      valueFormatter: (params: any) => params.value || '-',
    },
    {
      headerName: 'Status',
      field: 'status',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 100,
      cellRenderer: (params: any) => {
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
      },
    },
    {
      headerName: 'Location',
      field: 'location',
      sortable: true,
      filter: true,
      flex: 1.5,
      minWidth: 160,
      valueFormatter: (params: any) => params.value || '-',
    },
    {
      headerName: 'Created',
      field: 'created_at',
      sortable: true,
      filter: 'agDateColumnFilter',
      flex: 1,
      minWidth: 110,
      valueFormatter: (params: any) => {
        return new Date(params.value).toLocaleDateString();
      },
    },
    {
      headerName: 'Actions',
      cellRenderer: (params: any) => (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
          <Button 
            size="small" 
            variant="outlined"
            onClick={() => handleEdit(params.data)}
          >
            Edit
          </Button>
          <Button 
            size="small" 
            variant="outlined" 
            color="error"
            onClick={() => handleDelete(params.data.id)}
          >
            Delete
          </Button>
        </Box>
      ),
      flex: 1,
      minWidth: 140,
      sortable: false,
      filter: false,
      pinned: 'right',
    },
  ], [handleEdit, handleDelete]);

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
  }), []);

  const handleGridReady = useCallback((params: any) => {
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
            columnDefs={columnDefs as any}
            defaultColDef={defaultColDef}
            onGridReady={handleGridReady}
            loading={loading}
            pagination={true}
            paginationPageSize={20}
            animateRows={true}
            rowHeight={50}
            theme="legacy"
          />
        </div>
      </Box>
    </Box>
  );
};