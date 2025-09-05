import React from "react";
import { Box, Alert } from "@mui/material";
import { AgGridReact } from "ag-grid-react";
import type { GridReadyEvent, ColDef, ICellRendererParams, SelectionChangedEvent, GridApi } from "ag-grid-community";
import { defaultColDef, columnTypes } from "../columnConfig";
import type { Asset } from "../types";

interface AssetGridProps {
  assets: Asset[];
  columnDefs: ColDef[];
  components: { actionsRenderer: (params: ICellRendererParams<Asset>) => React.ReactElement; statusRenderer: (params: ICellRendererParams) => React.ReactElement };
  loading: boolean;
  error: string | null;
  onGridReady: (params: GridReadyEvent) => void;
  onSelectionChanged?: (selectedAssets: Asset[]) => void;
  gridApi?: GridApi<Asset> | null;
}

const ErrorAlert: React.FC<{ error: string }> = ({ error }) => (
  <Alert severity="error" sx={{ mb: 2 }}>
    {error}
  </Alert>
);

const GridContainer: React.FC<{
  assets: Asset[];
  columnDefs: ColDef[];
  components: { actionsRenderer: (params: ICellRendererParams<Asset>) => React.ReactElement; statusRenderer: (params: ICellRendererParams) => React.ReactElement };
  loading: boolean;
  onGridReady: (params: GridReadyEvent) => void;
  onSelectionChanged?: (selectedAssets: Asset[]) => void;
}> = ({ assets, columnDefs, components, loading, onGridReady, onSelectionChanged }) => {
  const handleSelectionChanged = (event: SelectionChangedEvent<Asset>): void => {
    const selectedRows = event.api.getSelectedRows();
    onSelectionChanged?.(selectedRows);
  };

  return (
    <Box sx={{ 
      height: 'calc(100vh - 200px)', 
      width: "100%",
      minHeight: 500
    }}>
    <div className="ag-theme-alpine" style={{ height: "100%", width: "100%" }}>
      <AgGridReact
        rowData={assets}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        columnTypes={columnTypes}
        components={components}
        onGridReady={onGridReady}
        onSelectionChanged={handleSelectionChanged}
        loading={loading}
        pagination={true}
        paginationPageSize={20}
        animateRows={true}
        suppressDragLeaveHidesColumns={true}
        rowSelection="multiple"
        suppressRowClickSelection={false}
        theme="legacy"
      />
    </div>
    </Box>
  );
};

export const AssetGrid: React.FC<AssetGridProps> = ({
  assets,
  columnDefs,
  components,
  loading,
  error,
  onGridReady,
  onSelectionChanged,
}) => (
  <>
    {error && <ErrorAlert error={error} />}
    <GridContainer
      assets={assets}
      columnDefs={columnDefs}
      components={components}
      loading={loading}
      onGridReady={onGridReady}
      onSelectionChanged={onSelectionChanged}
    />
  </>
);
