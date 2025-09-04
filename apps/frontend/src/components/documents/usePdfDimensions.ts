import { useMemo } from 'react';
import { LatLngBounds } from 'leaflet';
import { createPDFBounds, getPDFDimensions } from './pdfUtils';

interface PdfInfo {
  dimensions: { width: number; height: number };
}

export const usePdfDimensions = (pdfInfo: PdfInfo | null): { logicalWidth: number; logicalHeight: number; bounds: LatLngBounds } | null => {
  return useMemo(() => {
    if (!pdfInfo) {
      return null;
    }
    
    const { logicalWidth, logicalHeight } = getPDFDimensions(pdfInfo);
    const bounds = createPDFBounds(pdfInfo.dimensions.width, pdfInfo.dimensions.height);
    
    return { logicalWidth, logicalHeight, bounds };
  }, [pdfInfo]);
};