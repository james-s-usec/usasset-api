import React from 'react';
import {
  Paper,
  Toolbar,
  Typography,
  Chip,
} from '@mui/material';
import { PDFNavigationControls } from './PDFNavigationControls';
import { PDFZoomControls } from './PDFZoomControls';

interface PDFToolbarProps {
  fileName: string;
  currentPage: number;
  pageCount: number;
  zoom: number;
  maxZoom: number;
  onPageChange: (page: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
}

const PageInfo: React.FC<{ currentPage: number; pageCount: number }> = ({ 
  currentPage, 
  pageCount 
}) => (
  <Chip 
    label={`Page ${currentPage} of ${pageCount}`} 
    variant="outlined" 
    size="small"
  />
);

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

export const PDFToolbar: React.FC<PDFToolbarProps> = ({
  fileName,
  currentPage,
  pageCount,
  zoom,
  maxZoom,
  onPageChange,
  onZoomIn,
  onZoomOut,
  onFitToScreen
}) => (
  <Paper elevation={2}>
    <Toolbar sx={{ gap: 2 }}>
      <FileTitle fileName={fileName} />
      <PageInfo currentPage={currentPage} pageCount={pageCount} />
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
  </Paper>
);