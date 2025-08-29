import type { CellStyle } from 'ag-grid-community';

export const getLogLevelStyle = (level: string): CellStyle => {
  switch (level) {
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
};