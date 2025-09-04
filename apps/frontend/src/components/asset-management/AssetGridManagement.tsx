import React, { useEffect, useMemo, useCallback } from "react";
import { Box } from "@mui/material";
import type { GridReadyEvent } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "./AssetGrid.css";
import { getEnabledColumns } from "./columnConfig";
import { useAssetData } from "./components/useAssetData";
import { useAssetActions } from "./components/useAssetActions";
import { useColumnCategories } from "./components/useColumnCategories";
import { useActionsCellRenderer, useStatusCellRenderer, useGridComponents } from "./components/useGridRenderers";
import { AssetHeader } from "./components/AssetHeader";
import { AssetGrid } from "./components/AssetGrid";

const useGridReady = (): ((params: GridReadyEvent) => void) => {
  return useCallback((params: GridReadyEvent) => {
    params.api.sizeColumnsToFit();
  }, []);
};

export const AssetGridManagement: React.FC = () => {
  const { assets, loading, error, fetchAssets } = useAssetData();
  const { columnCategories, handleCategoryToggle } = useColumnCategories();
  const { handleAdd, handleEdit, handleDelete } = useAssetActions(fetchAssets);
  
  const actionsCellRenderer = useActionsCellRenderer({ onEdit: handleEdit, onDelete: handleDelete });
  const statusCellRenderer = useStatusCellRenderer();
  const components = useGridComponents(actionsCellRenderer, statusCellRenderer);
  
  const columnDefs = useMemo(() => {
    return getEnabledColumns(columnCategories);
  }, [columnCategories]);
  
  const handleGridReady = useGridReady();

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  return (
    <Box>
      <AssetHeader
        columnCategories={columnCategories}
        onCategoryToggle={handleCategoryToggle}
        onRefresh={fetchAssets}
        onAdd={handleAdd}
        loading={loading}
      />
      <AssetGrid
        assets={assets}
        columnDefs={columnDefs}
        components={components}
        loading={loading}
        error={error}
        onGridReady={handleGridReady}
      />
    </Box>
  );
};
