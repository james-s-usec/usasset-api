import type { ValueFormatterParams } from 'ag-grid-community';

export const formatDateColumn = (params: ValueFormatterParams): string => {
  return new Date(params.value).toLocaleString();
};