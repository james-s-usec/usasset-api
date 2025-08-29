import type { ColDef } from 'ag-grid-community';
import { getLogLevelStyle } from '../utils/log-level-styles';
import { formatDateColumn } from '../utils/date-formatter';
import { MetadataCellRenderer } from './MetadataCellRenderer';

export const createLevelColumn = (): ColDef => ({
  field: 'level',
  headerName: 'Level',
  width: 80,
  cellStyle: (params) => getLogLevelStyle(params.value),
});

export const createTimeColumn = (): ColDef => ({
  field: 'created_at',
  headerName: 'Time',
  width: 180,
  valueFormatter: formatDateColumn,
});

export const createCorrelationColumn = (): ColDef => ({
  field: 'correlation_id',
  headerName: 'Correlation ID',
  width: 200,
  cellStyle: { fontFamily: 'monospace', fontSize: '12px' },
});

export const createMessageColumn = (): ColDef => ({
  field: 'message',
  headerName: 'Message',
  flex: 1,
  wrapText: true,
  autoHeight: true,
});

export const createMetadataColumn = (onViewMetadata: (data: unknown, title: string) => void): ColDef => ({
  field: 'metadata',
  headerName: 'Metadata',
  width: 220,
  cellRenderer: MetadataCellRenderer,
  cellRendererParams: { onViewMetadata },
  cellStyle: { padding: '4px' },
});