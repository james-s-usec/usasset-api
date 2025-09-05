import React from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

interface RawDataPreviewProps {
  data: Record<string, string>[];
}

// Table header component - reduces JSX depth
const DataTableHeader: React.FC<{ columns: string[] }> = ({ columns }) => (
  <TableHead>
    <TableRow>
      <TableCell>Row</TableCell>
      {columns.map((col) => (
        <TableCell key={col}>{col}</TableCell>
      ))}
    </TableRow>
  </TableHead>
);

// Table body component - reduces JSX depth
const DataTableBody: React.FC<{
  data: Record<string, string>[];
  columns: string[];
}> = ({ data, columns }) => (
  <TableBody>
    {data.slice(0, 10).map((row, index) => (
      <TableRow key={index}>
        <TableCell>{index + 2}</TableCell>
        {columns.map((col) => (
          <TableCell key={col}>{row[col] || '-'}</TableCell>
        ))}
      </TableRow>
    ))}
  </TableBody>
);

// Main component - under 30 lines
export const RawDataPreview: React.FC<RawDataPreviewProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return null;
  }

  const columns = Object.keys(data[0]);

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Raw CSV Data (First 10 rows)
      </Typography>
      <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
        <Table stickyHeader size="small">
          <DataTableHeader columns={columns} />
          <DataTableBody data={data} columns={columns} />
        </Table>
      </TableContainer>
    </Box>
  );
};