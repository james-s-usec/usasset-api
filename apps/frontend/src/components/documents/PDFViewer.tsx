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

interface PDFViewerProps {
  fileId: string;
  fileName: string;
}

const createToolbarProps = (
  fileName: string, 
  controls: ReturnType<typeof usePdfControls>, 
  pdfInfo: { pageCount: number; maxZoom: number }
): React.ComponentProps<typeof PDFToolbar> => ({
  fileName,
  currentPage: controls.currentPage,
  pageCount: pdfInfo.pageCount,
  zoom: controls.zoom,
  maxZoom: pdfInfo.maxZoom,
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
  logicalWidth: dimensions.logicalWidth,
  logicalHeight: dimensions.logicalHeight,
  bounds: dimensions.bounds,
  pdfInfo,
  zoom: controls.zoom,
  onZoomChange: controls.handleZoomChange
});

export const PDFViewer: React.FC<PDFViewerProps> = ({ fileId, fileName }) => {
  const { pdfInfo, loading, error } = usePdfInfo(fileId);
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
      <PDFToolbar {...createToolbarProps(fileName, controls, pdfInfo)} />
      <PDFMapWrapper>
        <PDFMapContainer {...createMapProps(fileId, controls, dimensions, pdfInfo)} />
      </PDFMapWrapper>
    </PDFViewerContainer>
  );
};