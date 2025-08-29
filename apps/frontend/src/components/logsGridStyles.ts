import type { RowClassParams } from 'ag-grid-community';

export const getLogRowStyle = (params: RowClassParams): { backgroundColor: string } | undefined => {
  if (params.data.level === 'ERROR') {
    return { backgroundColor: '#ffebee' };
  }
  if (params.data.level === 'WARN') {
    return { backgroundColor: '#fff8e1' };
  }
  return undefined;
};

export const defaultColDef = {
  resizable: true,
  sortable: true,
  filter: true,
};

export const gridOptions = {
  pagination: true,
  paginationPageSize: 10,
  animateRows: true,
  theme: "legacy" as const,
};