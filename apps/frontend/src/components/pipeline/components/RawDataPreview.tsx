import React from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

interface RawDataPreviewProps {
  data: Record<string, string>[];
}

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
          <TableHead>
            <TableRow>
              <TableCell>Row</TableCell>
              {columns.map((col) => (
                <TableCell key={col}>{col}</TableCell>
              ))}
            </TableRow>
          </TableHead>
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
        </Table>
      </TableContainer>
    </Box>
  );
};