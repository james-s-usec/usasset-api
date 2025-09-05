import React from 'react';
import 'leaflet/dist/leaflet.css';
import { PDFToolbar } from './PDFToolbar';
import { PDFMapContainer } from './PDFMapContainer';
import { PDFLoadingState } from './PDFLoadingState';
import { PDFErrorState } from './PDFErrorState';
import { PDFViewerContainer, PDFMapWrapper } from './PDFViewerContainer';
import { usePdfInfo } from './usePdfInfo';
import { usePdfControls } from './usePdfControls';
import { usePdfDimensions } from './usePdfDimensions';
import { usePdfValidation } from './usePdfValidation';

interface PDFViewerProps {
  fileId: string;
  fileName: string;
}

const createToolbarProps = (
  fileName: string, 
  controls: ReturnType<typeof usePdfControls>, 
  pdfInfo: { pageCount: number; maxZoom: number },
  validation: ReturnType<typeof usePdfValidation>['validation']
): React.ComponentProps<typeof PDFToolbar> => ({
  fileName,
  currentPage: controls.currentPage,
  pageCount: pdfInfo.pageCount,
  zoom: controls.zoom,
  maxZoom: pdfInfo.maxZoom,
  validation: validation || undefined,
  onPageChange: controls.handlePageChange,
  onZoomIn: controls.handleZoomIn,
  onZoomOut: controls.handleZoomOut,
  onFitToScreen: controls.handleFitToScreen
});

const createMapProps = (
  fileId: string, 
  controls: ReturnType<typeof usePdfControls>, 
  dimensions: NonNullable<ReturnType<typeof usePdfDimensions>>, 
  pdfInfo: { maxZoom: number; tileSize: number }
): React.ComponentProps<typeof PDFMapContainer> => ({
  fileId,
  currentPage: controls.currentPage,
  pdfInfo: {
    ...pdfInfo,
    dimensions: { width: dimensions.logicalWidth, height: dimensions.logicalHeight }
  },
  zoom: controls.zoom,
  onZoomChange: controls.handleZoomChange
});

export const PDFViewer: React.FC<PDFViewerProps> = ({ fileId, fileName }) => {
  const { pdfInfo, loading, error } = usePdfInfo(fileId);
  const { validation } = usePdfValidation(fileId);
  const controls = usePdfControls(pdfInfo);
  const dimensions = usePdfDimensions(pdfInfo);

  if (loading) {
    return <PDFLoadingState />;
  }

  if (error || !pdfInfo || !dimensions) {
    return <PDFErrorState error={error || 'Failed to load PDF'} />;
  }

  return (
    <PDFViewerContainer>
      <PDFToolbar {...createToolbarProps(fileName, controls, pdfInfo, validation)} />
      <PDFMapWrapper>
        <PDFMapContainer {...createMapProps(fileId, controls, dimensions, pdfInfo)} />
      </PDFMapWrapper>
    </PDFViewerContainer>
  );
};