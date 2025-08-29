import type { ColDef, CellStyle, ValueFormatterParams } from 'ag-grid-community';
import { MetadataCellRenderer } from './MetadataCellRenderer';

export const createLogsColumnDefs = (onViewMetadata: (data: unknown, title: string) => void): ColDef[] => [
  {
    field: 'level',
    headerName: 'Level',
    width: 80,
    cellStyle: (params): CellStyle => {
      switch (params.value) {
        case 'ERROR':
          return { color: '#d32f2f', fontWeight: 'bold' };
        case 'WARN':
          return { color: '#ed6c02', fontWeight: 'bold' };
        case 'INFO':
          return { color: '#1976d2' };
        case 'DEBUG':
          return { color: '#757575' };
        default:
          return {};
      }
    },
  },
  {
    field: 'created_at',
    headerName: 'Time',
    width: 180,
    valueFormatter: (params: ValueFormatterParams) => {
      return new Date(params.value).toLocaleString();
    },
  },
  {
    field: 'correlation_id',
    headerName: 'Correlation ID',
    width: 200,
    cellStyle: { fontFamily: 'monospace', fontSize: '12px' },
  },
  {
    field: 'message',
    headerName: 'Message',
    flex: 1,
    wrapText: true,
    autoHeight: true,
  },
  {
    field: 'metadata',
    headerName: 'Metadata',
    width: 220,
    cellRenderer: MetadataCellRenderer,
    cellRendererParams: {
      onViewMetadata,
    },
    cellStyle: { padding: '4px' },
  },
];