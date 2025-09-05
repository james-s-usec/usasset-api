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

// Cell value formatter - extracts complex logic
const formatCellValue = (value: unknown): string => {
  if (value !== undefined && value !== null) {
    return String(value);
  }
  return '-';
};

// Data columns component
const DataColumns: React.FC<{
  columns: string[];
  mappedData: Record<string, unknown>;
}> = ({ columns, mappedData }) => (
  <>
    {columns.map(col => (
      <TableCell key={col}>
        {formatCellValue(mappedData[col])}
      </TableCell>
    ))}
  </>
);

// Main component - under 30 lines
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
    <DataColumns columns={columns} mappedData={row.mappedData} />
  </TableRow>
);