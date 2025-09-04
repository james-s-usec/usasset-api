import { useState } from 'react';

interface PdfInfo {
  pageCount: number;
  maxZoom: number;
}

export const usePdfControls = (pdfInfo: PdfInfo | null): {
  currentPage: number;
  zoom: number;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleFitToScreen: () => void;
  handlePageChange: (newPage: number) => void;
  handleZoomChange: (newZoom: number) => void;
} => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(0);

  const handlers = {
    handleZoomIn: (): void => {
      if (pdfInfo && zoom < pdfInfo.maxZoom) {
        setZoom(zoom + 1);
      }
    },
    handleZoomOut: (): void => {
      if (zoom > 0) {
        setZoom(zoom - 1);
      }
    },
    handleFitToScreen: (): void => {
      setZoom(0);
    },
    handlePageChange: (newPage: number): void => {
      if (pdfInfo && newPage >= 1 && newPage <= pdfInfo.pageCount) {
        setCurrentPage(newPage);
      }
    },
    handleZoomChange: (newZoom: number): void => {
      setZoom(newZoom);
    }
  };

  return { currentPage, zoom, ...handlers };
};