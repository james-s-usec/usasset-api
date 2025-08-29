import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import type { GridReadyEvent } from 'ag-grid-community';
import { Box } from '@mui/material';
import type { LogEntry } from '../services/logs-api';
import { DebugLogger } from '../services/debug-logger';
import { createLogsColumnDefs } from './logsColumnDefs';
import { getLogRowStyle, defaultColDef, gridOptions } from './logsGridStyles';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

export interface LogsDataGridProps {
  logs: LogEntry[];
  onViewMetadata: (data: unknown, title: string) => void;
}

export const LogsDataGrid = ({ logs, onViewMetadata }: LogsDataGridProps) => {
  const columnDefs = createLogsColumnDefs(onViewMetadata);

  const handleGridReady = (params: GridReadyEvent) => {
    DebugLogger.logUIEvent('DebugPage: AG Grid ready', { 
      rowCount: logs.length 
    });
    params.api.sizeColumnsToFit();
  };

  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <div className="ag-theme-material" style={{ height: '100%', width: '100%' }}>
        <AgGridReact
          rowData={logs}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          pagination={gridOptions.pagination}
          paginationPageSize={gridOptions.paginationPageSize}
          animateRows={gridOptions.animateRows}
          theme={gridOptions.theme}
          onGridReady={handleGridReady}
          getRowStyle={getLogRowStyle}
        />
      </div>
    </Box>
  );
};