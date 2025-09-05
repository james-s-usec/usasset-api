import React from 'react';
import { Box, Typography } from '@mui/material';

interface StagingDataRowProps {
  row: {
    rowNumber: number;
    mappedData: Record<string, unknown>;
    rawData: Record<string, unknown>;
  };
}

// Field mapping configuration - reduces complexity
const FIELD_MAPPINGS = [
  { key: 'assetTag', label: 'assetTag', defaultValue: (rowNumber: number): string => `IMPORT-${rowNumber}` },
  { key: 'name', label: 'name', defaultValue: (): string => 'Unnamed Asset' },
  { key: 'description', label: 'description', defaultValue: (): string => 'null' },
  { key: 'buildingName', label: 'buildingName', defaultValue: (): string => 'null' },
  { key: 'floor', label: 'floor', defaultValue: (): string => 'null' },
  { key: 'room', label: 'roomNumber', defaultValue: (): string => 'null' },
  { key: 'status', label: 'status', defaultValue: (): string => 'ACTIVE' },
  { key: 'conditionAssessment', label: 'condition', defaultValue: (): string => 'GOOD' },
  { key: 'manufacturer', label: 'manufacturer', defaultValue: (): string => 'null' },
  { key: 'modelNumber', label: 'modelNumber', defaultValue: (): string => 'null' },
  { key: 'serialNumber', label: 'serialNumber', defaultValue: (): string => 'null' }
];

// Field display component
const FieldDisplay: React.FC<{
  mappedData: Record<string, unknown>;
  rowNumber: number;
}> = ({ mappedData, rowNumber }) => (
  <Box sx={{ mt: 1, fontFamily: 'monospace', fontSize: '0.8rem' }}>
    {FIELD_MAPPINGS.map(({ key, label, defaultValue }) => (
      <div key={key}>
        <strong>{label}:</strong> {String(mappedData[key] || defaultValue(rowNumber))}
      </div>
    ))}
  </Box>
);

// Main component - complexity under 7
export const StagingDataRow: React.FC<StagingDataRowProps> = ({ row }) => (
  <Box sx={{ 
    p: 2, 
    mb: 2, 
    border: 1, 
    borderColor: 'success.light', 
    borderRadius: 1, 
    bgcolor: 'white' 
  }}>
    <Typography variant="body2" fontWeight="bold" color="success.main">
      Row {row.rowNumber} → Asset Database Fields:
    </Typography>
    
    <FieldDisplay mappedData={row.mappedData} rowNumber={row.rowNumber} />
    
    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
      Raw CSV: {JSON.stringify(row.rawData).substring(0, 100)}...
    </Typography>
  </Box>
);