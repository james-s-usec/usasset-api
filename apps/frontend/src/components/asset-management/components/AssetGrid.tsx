import React from "react";
import { Box, Alert } from "@mui/material";
import { AgGridReact } from "ag-grid-react";
import type { GridReadyEvent, ColDef, ICellRendererParams } from "ag-grid-community";
import { defaultColDef, columnTypes } from "../columnConfig";
import type { Asset } from "../types";

interface AssetGridProps {
  assets: Asset[];
  columnDefs: ColDef[];
  components: { actionsRenderer: (params: ICellRendererParams<Asset>) => React.ReactElement; statusRenderer: (params: ICellRendererParams) => React.ReactElement };
  loading: boolean;
  error: string | null;
  onGridReady: (params: GridReadyEvent) => void;
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
}> = ({ assets, columnDefs, components, loading, onGridReady }) => (
  <Box sx={{ height: 600, width: "100%" }}>
    <div className="ag-theme-alpine" style={{ height: "100%", width: "100%" }}>
      <AgGridReact
        rowData={assets}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        columnTypes={columnTypes}
        components={components}
        onGridReady={onGridReady}
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
);

export const AssetGrid: React.FC<AssetGridProps> = ({
  assets,
  columnDefs,
  components,
  loading,
  error,
  onGridReady,
}) => (
  <>
    {error && <ErrorAlert error={error} />}
    <GridContainer
      assets={assets}
      columnDefs={columnDefs}
      components={components}
      loading={loading}
      onGridReady={onGridReady}
    />
  </>
);
