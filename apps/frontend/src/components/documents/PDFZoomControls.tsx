import React from 'react';
import {
  Box,
  IconButton,
  Chip,
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  FitScreen,
} from '@mui/icons-material';

interface PDFZoomControlsProps {
  zoom: number;
  maxZoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
}

export const PDFZoomControls: React.FC<PDFZoomControlsProps> = ({
  zoom,
  maxZoom,
  onZoomIn,
  onZoomOut,
  onFitToScreen
}) => {
  const isMinZoom = zoom <= 0;
  const isMaxZoom = zoom >= maxZoom;
  const zoomPercentage = Math.round(Math.pow(2, zoom) * 100);

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <IconButton onClick={onZoomOut} disabled={isMinZoom}>
        <ZoomOut />
      </IconButton>
      
      <Chip 
        label={`${zoomPercentage}%`} 
        variant="outlined" 
        size="small"
        sx={{ minWidth: 60 }}
      />
      
      <IconButton onClick={onZoomIn} disabled={isMaxZoom}>
        <ZoomIn />
      </IconButton>
      
      <IconButton onClick={onFitToScreen}>
        <FitScreen />
      </IconButton>
    </Box>
  );
};