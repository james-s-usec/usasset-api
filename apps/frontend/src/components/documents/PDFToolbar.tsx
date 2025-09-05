import React from 'react';
import {
  Paper,
  Toolbar,
  Typography,
  Chip,
  Tooltip,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { PDFNavigationControls } from './PDFNavigationControls';
import { PDFZoomControls } from './PDFZoomControls';

interface PDFValidation {
  totalPages: number;
  validPages: number[];
  invalidPages: Array<{ page: number; error: string }>;
}

interface PDFToolbarProps {
  fileName: string;
  currentPage: number;
  pageCount: number;
  zoom: number;
  maxZoom: number;
  validation?: PDFValidation;
  onPageChange: (page: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
}

const PageCounter: React.FC<{
  currentPage: number;
  pageCount: number;
}> = ({ currentPage, pageCount }) => (
  <Chip 
    label={`Page ${currentPage} of ${pageCount}`} 
    variant="outlined" 
    size="small"
  />
);

const PageError: React.FC<{
  currentPage: number;
  error?: { page: number; error: string };
}> = ({ currentPage, error }) => error ? (
  <Tooltip title={`Page ${currentPage}: ${error.error}`} arrow>
    <Chip 
      icon={<WarningIcon />}
      label="Rendering Error"
      color="warning"
      size="small"
      variant="outlined"
    />
  </Tooltip>
) : null;

const ValidationSummary: React.FC<{
  validation?: PDFValidation;
}> = ({ validation }) => validation && validation.invalidPages.length > 0 ? (
  <Tooltip 
    title={`Pages with errors: ${validation.invalidPages.map(p => p.page).join(', ')}`}
    arrow
  >
    <Chip 
      label={`${validation.invalidPages.length} pages have errors`}
      color="warning"
      size="small"
    />
  </Tooltip>
) : null;

const PageInfo: React.FC<{ 
  currentPage: number; 
  pageCount: number; 
  validation?: PDFValidation;
}> = ({ currentPage, pageCount, validation }) => {
  const currentPageError = validation?.invalidPages.find(p => p.page === currentPage);
  
  return (
    <>
      <PageCounter currentPage={currentPage} pageCount={pageCount} />
      <PageError currentPage={currentPage} error={currentPageError} />
      <ValidationSummary validation={validation} />
    </>
  );
};

const FileTitle: React.FC<{ fileName: string }> = ({ fileName }) => (
  <Typography 
    variant="h6" 
    component="div" 
    sx={{ flexGrow: 1 }}
    noWrap
  >
    {fileName}
  </Typography>
);

const PDFToolbarContent: React.FC<PDFToolbarProps> = ({
  fileName,
  currentPage,
  pageCount,
  zoom,
  maxZoom,
  validation,
  onPageChange,
  onZoomIn,
  onZoomOut,
  onFitToScreen
}) => (
  <Toolbar sx={{ gap: 2 }}>
    <FileTitle fileName={fileName} />
    <PageInfo currentPage={currentPage} pageCount={pageCount} validation={validation} />
    <PDFNavigationControls
      currentPage={currentPage}
      pageCount={pageCount}
      onPageChange={onPageChange}
    />
    <PDFZoomControls
      zoom={zoom}
      maxZoom={maxZoom}
      onZoomIn={onZoomIn}
      onZoomOut={onZoomOut}
      onFitToScreen={onFitToScreen}
    />
  </Toolbar>
);

export const PDFToolbar: React.FC<PDFToolbarProps> = (props) => (
  <Paper elevation={2}>
    <PDFToolbarContent {...props} />
  </Paper>
);