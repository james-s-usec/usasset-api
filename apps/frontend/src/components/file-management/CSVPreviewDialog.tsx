import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { parseCSV, type ParsedCSV } from '../../utils/csvParser';

interface CSVPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  fileName: string;
  fileId: string;
  getFileContent: (fileId: string) => Promise<string>;
}

const CSVTableHead: React.FC<{ headers: string[] }> = ({ headers }) => (
  <TableHead>
    <TableRow>
      {headers.map((header, index) => (
        <TableCell key={index} sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
          {header}
        </TableCell>
      ))}
    </TableRow>
  </TableHead>
);

const CSVTableBody: React.FC<{ rows: string[][] }> = ({ rows }) => (
  <TableBody>
    {rows.map((row, rowIndex) => (
      <TableRow key={rowIndex} hover>
        {row.map((cell, cellIndex) => (
          <TableCell key={cellIndex}>{cell}</TableCell>
        ))}
      </TableRow>
    ))}
  </TableBody>
);

const DialogHeader: React.FC<{ fileName: string; onClose: () => void }> = ({ fileName, onClose }) => (
  <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <Typography variant="h6">{fileName}</Typography>
    <IconButton onClick={onClose}>
      <CloseIcon />
    </IconButton>
  </DialogTitle>
);

const CSVContent: React.FC<{ 
  loading: boolean; 
  error: string | null; 
  csvData: ParsedCSV | null;
}> = ({ loading, error, csvData }) => (
  <DialogContent>
    {loading && (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    )}
    
    {error && (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    )}
    
    {csvData && !loading && (
      <>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Showing first {csvData.rows.length} of {csvData.totalRows} rows
        </Typography>
        
        <TableContainer component={Paper} sx={{ maxHeight: '60vh' }}>
          <Table stickyHeader size="small">
            <CSVTableHead headers={csvData.headers} />
            <CSVTableBody rows={csvData.rows} />
          </Table>
        </TableContainer>
      </>
    )}
  </DialogContent>
);

const useCSVData = (open: boolean, fileId: string, getFileContent: (fileId: string) => Promise<string>): {
  loading: boolean;
  error: string | null;
  csvData: ParsedCSV | null;
  setCsvData: (data: ParsedCSV | null) => void;
  setError: (error: string | null) => void;
} => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<ParsedCSV | null>(null);

  useEffect(() => {
    if (open && fileId) {
      setLoading(true);
      setError(null);
      
      getFileContent(fileId)
        .then(content => {
          const parsed = parseCSV(content, 100);
          setCsvData(parsed);
        })
        .catch(err => {
          setError('Failed to load CSV content');
          console.error('Error loading CSV:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, fileId, getFileContent]);

  return { loading, error, csvData, setCsvData, setError };
};

export const CSVPreviewDialog: React.FC<CSVPreviewDialogProps> = ({
  open,
  onClose,
  fileName,
  fileId,
  getFileContent,
}) => {
  const { loading, error, csvData, setCsvData, setError } = useCSVData(open, fileId, getFileContent);

  const handleClose = (): void => {
    setCsvData(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="lg" 
      fullWidth
    >
      <DialogHeader fileName={fileName} onClose={handleClose} />
      <CSVContent loading={loading} error={error} csvData={csvData} />
    </Dialog>
  );
};