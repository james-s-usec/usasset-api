import { useState, useCallback } from 'react';

interface PdfInfo {
  pageCount: number;
  maxZoom: number;
}

interface PdfControlsReturn {
  currentPage: number;
  zoom: number;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleFitToScreen: () => void;
  handlePageChange: (newPage: number) => void;
  handleZoomChange: (newZoom: number) => void;
}

// Helper hook for zoom controls
const useZoomControls = (
  pdfInfo: PdfInfo | null,
  zoom: number,
  setZoom: (z: number) => void
): Omit<PdfControlsReturn, 'currentPage' | 'zoom' | 'handlePageChange'> => ({
  handleZoomIn: useCallback(() => {
    if (pdfInfo && zoom < pdfInfo.maxZoom) setZoom(zoom + 1);
  }, [pdfInfo, zoom, setZoom]),
  handleZoomOut: useCallback(() => {
    if (zoom > 0) setZoom(zoom - 1);
  }, [zoom, setZoom]),
  handleFitToScreen: useCallback(() => setZoom(0), [setZoom]),
  handleZoomChange: useCallback((newZoom: number) => setZoom(newZoom), [setZoom])
});

// Main hook - now under 30 lines
export const usePdfControls = (pdfInfo: PdfInfo | null): PdfControlsReturn => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(0);
  
  const zoomControls = useZoomControls(pdfInfo, zoom, setZoom);
  
  const handlePageChange = useCallback((newPage: number): void => {
    if (pdfInfo && newPage >= 1 && newPage <= pdfInfo.pageCount) {
      setCurrentPage(newPage);
    }
  }, [pdfInfo]);

  return { currentPage, zoom, ...zoomControls, handlePageChange };
};