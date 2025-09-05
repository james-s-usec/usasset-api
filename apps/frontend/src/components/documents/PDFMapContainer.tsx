import React from 'react';
import { MapContainer, ImageOverlay, useMapEvents } from 'react-leaflet';
import L, { LatLngBounds } from 'leaflet';
import { config } from '../../config';
import { PDFMapEventHandler } from './PDFMapEventHandler';
import { createPDFCRS } from './pdfUtils';

interface PDFMapContainerProps {
  fileId: string;
  currentPage: number;
  logicalWidth: number;
  logicalHeight: number;
  bounds: LatLngBounds;
  pdfInfo: {
    maxZoom: number;
    tileSize: number;
  };
  zoom: number;
  onZoomChange: (newZoom: number) => void;
}

// Helper to create map props
interface MapProps {
  crs: L.CRS;
  center: [number, number];
  zoom: number;
  minZoom: number;
  maxZoom: number;
  bounds: LatLngBounds;
  maxBounds: LatLngBounds;
  style: { width: string; height: string };
  zoomControl: boolean;
  attributionControl: boolean;
}

const getMapProps = (
  logicalWidth: number, 
  logicalHeight: number, 
  bounds: LatLngBounds,
  maxZoom: number
): MapProps => ({
  crs: L.CRS.Simple, // Use simple CRS for ImageOverlay
  center: [logicalHeight / 2, logicalWidth / 2] as [number, number],
  zoom: 0,
  minZoom: 0,
  maxZoom: 3, // Limit zoom for single image to avoid pixelation
  bounds,
  maxBounds: bounds,
  style: { width: '100%', height: '100%' },
  zoomControl: false,
  attributionControl: false
});

const FitBoundsOnLoad: React.FC<{ bounds: LatLngBounds }> = ({ bounds }) => {
  const map = useMapEvents({});
  
  React.useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds);
    }
  }, [bounds, map]);
  
  return null;
};

// Simplified component - now under 30 lines
export const PDFMapContainer: React.FC<PDFMapContainerProps> = ({
  fileId,
  currentPage,
  logicalWidth,
  logicalHeight,
  bounds,
  pdfInfo,
  zoom,
  onZoomChange
}) => {
  // Create proper bounds for ImageOverlay (use actual image dimensions, not scaled)
  const imageBounds = new L.LatLngBounds([0, 0], [logicalHeight, logicalWidth]);
  const mapProps = getMapProps(logicalWidth, logicalHeight, imageBounds, pdfInfo.maxZoom);
  const imageUrl = `${config.api.baseUrl}/api/files/${fileId}/pdf-image/${currentPage}.png`;
  
  return (
    <MapContainer {...mapProps}>
      <FitBoundsOnLoad bounds={imageBounds} />
      <PDFMapEventHandler
        pdfInfo={pdfInfo}
        bounds={imageBounds}
        zoom={zoom}
        onZoomChange={onZoomChange}
      />
      <ImageOverlay
        url={imageUrl}
        bounds={imageBounds}
      />
    </MapContainer>
  );
};