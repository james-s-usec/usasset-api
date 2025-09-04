import React from 'react';
import { Box } from '@mui/material';
import 'leaflet/dist/leaflet.css';
import { PDFToolbar } from './PDFToolbar';
import { PDFMapContainer } from './PDFMapContainer';
import { PDFLoadingState } from './PDFLoadingState';
import { PDFErrorState } from './PDFErrorState';
import { usePdfInfo } from './usePdfInfo';
import { usePdfControls } from './usePdfControls';
import { createPDFBounds, getPDFDimensions } from './pdfUtils';

interface PDFViewerProps {
  fileId: string;
  fileName: string;
}


export const PDFViewer: React.FC<PDFViewerProps> = ({ fileId, fileName }) => {
  const { pdfInfo, loading, error } = usePdfInfo(fileId);
  const {
    currentPage,
    zoom,
    handleZoomIn,
    handleZoomOut,
    handleFitToScreen,
    handlePageChange,
    handleZoomChange
  } = usePdfControls(pdfInfo);


  if (loading) {
    return <PDFLoadingState />;
  }

  if (error || !pdfInfo) {
    return <PDFErrorState error={error || 'Failed to load PDF'} />;
  }

  const { logicalWidth, logicalHeight } = getPDFDimensions(pdfInfo);
  const bounds = createPDFBounds(pdfInfo.dimensions.width, pdfInfo.dimensions.height);

  return (
    <Box sx={{ 
      height: { 
        xs: '100dvh', // Dynamic viewport height for mobile
        sm: '100vh'   // Standard viewport height for desktop
      }, 
      display: 'flex', 
      flexDirection: 'column' 
    }}>
      <PDFToolbar
        fileName={fileName}
        currentPage={currentPage}
        pageCount={pdfInfo.pageCount}
        zoom={zoom}
        maxZoom={pdfInfo.maxZoom}
        onPageChange={handlePageChange}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitToScreen={handleFitToScreen}
      />

      <Box sx={{ flexGrow: 1, position: 'relative' }}>
        <PDFMapContainer
          fileId={fileId}
          currentPage={currentPage}
          logicalWidth={logicalWidth}
          logicalHeight={logicalHeight}
          bounds={bounds}
          pdfInfo={pdfInfo}
          zoom={zoom}
          onZoomChange={handleZoomChange}
        />
      </Box>
    </Box>
  );
};