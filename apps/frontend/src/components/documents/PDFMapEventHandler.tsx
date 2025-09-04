import React, { useEffect } from 'react';
import { useMapEvents } from 'react-leaflet';
import { LatLngBounds } from 'leaflet';

interface PDFMapEventHandlerProps {
  pdfInfo: { maxZoom: number } | null;
  bounds: LatLngBounds | null;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
}

export const PDFMapEventHandler: React.FC<PDFMapEventHandlerProps> = ({
  pdfInfo,
  bounds,
  zoom,
  onZoomChange
}) => {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    }
  });
  
  // Fit bounds on initial load for better mobile experience
  useEffect(() => {
    if (pdfInfo && bounds) {
      map.fitBounds(bounds);
    }
  }, [pdfInfo, bounds, map]);
  
  // Sync zoom when our state changes
  useEffect(() => {
    if (map.getZoom() !== zoom) {
      map.setZoom(zoom);
    }
  }, [zoom, map]);
  
  return null;
};