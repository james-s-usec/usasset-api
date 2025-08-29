import type { ColDef } from 'ag-grid-community';
import {
  createLevelColumn,
  createTimeColumn,
  createCorrelationColumn,
  createMessageColumn,
  createMetadataColumn
} from './logs-column-configs';

export const createLogsColumnDefs = (onViewMetadata: (data: unknown, title: string) => void): ColDef[] => [
  createLevelColumn(),
  createTimeColumn(),
  createCorrelationColumn(),
  createMessageColumn(),
  createMetadataColumn(onViewMetadata),
];