import { useState } from 'react';

interface PdfInfo {
  pageCount: number;
  maxZoom: number;
}

export const usePdfControls = (pdfInfo: PdfInfo | null) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(0);

  const handleZoomIn = (): void => {
    if (pdfInfo && zoom < pdfInfo.maxZoom) {
      setZoom(zoom + 1);
    }
  };

  const handleZoomOut = (): void => {
    if (zoom > 0) {
      setZoom(zoom - 1);
    }
  };

  const handleFitToScreen = (): void => {
    setZoom(0);
  };

  const handlePageChange = (newPage: number): void => {
    if (pdfInfo && newPage >= 1 && newPage <= pdfInfo.pageCount) {
      setCurrentPage(newPage);
    }
  };

  const handleZoomChange = (newZoom: number): void => {
    setZoom(newZoom);
  };

  return {
    currentPage,
    zoom,
    handleZoomIn,
    handleZoomOut,
    handleFitToScreen,
    handlePageChange,
    handleZoomChange
  };
};