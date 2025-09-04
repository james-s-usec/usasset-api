import React from 'react';
import { 
  TableRow, 
  TableCell, 
  Checkbox 
} from '@mui/material';
import { StagingRowStatus } from './StagingRowStatus';

interface StagedRow {
  rowNumber: number;
  isValid: boolean;
  willImport: boolean;
  rawData: Record<string, unknown>;
  mappedData: Record<string, unknown>;
  errors: string[] | null;
}

interface StagingTableRowProps {
  row: StagedRow;
  columns: string[];
}

export const StagingTableRow: React.FC<StagingTableRowProps> = ({
  row,
  columns,
}) => (
  <TableRow 
    sx={{ 
      backgroundColor: !row.isValid ? 'error.50' : 'inherit',
      '&:hover': { backgroundColor: !row.isValid ? 'error.100' : 'action.hover' }
    }}
  >
    <TableCell padding="checkbox">
      <Checkbox 
        checked={row.willImport}
        disabled={!row.isValid}
        size="small"
      />
    </TableCell>
    <TableCell>{row.rowNumber}</TableCell>
    <TableCell>
      <StagingRowStatus 
        isValid={row.isValid}
        errors={row.errors}
      />
    </TableCell>
    {columns.map(col => (
      <TableCell key={col}>
        {row.mappedData?.[col] || '-'}
      </TableCell>
    ))}
  </TableRow>
);