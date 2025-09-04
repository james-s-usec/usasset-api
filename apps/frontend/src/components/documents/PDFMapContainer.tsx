import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { LatLngBounds } from 'leaflet';
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
const getMapProps = (
  logicalWidth: number, 
  logicalHeight: number, 
  bounds: LatLngBounds,
  maxZoom: number
): any => ({
  crs: createPDFCRS(logicalWidth, logicalHeight),
  center: [logicalHeight / 2, logicalWidth / 2] as [number, number],
  zoom: 1,
  minZoom: 0,
  maxZoom,
  bounds,
  maxBounds: bounds,
  style: { width: '100%', height: '100%' },
  zoomControl: false,
  attributionControl: false
});

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
  const mapProps = getMapProps(logicalWidth, logicalHeight, bounds, pdfInfo.maxZoom);
  const tileUrl = `${config.api.baseUrl}/api/files/${fileId}/pdf-tiles/${currentPage}/{z}/{x}/{y}.png`;
  
  return (
    <MapContainer {...mapProps}>
      <PDFMapEventHandler
        pdfInfo={pdfInfo}
        bounds={bounds}
        zoom={zoom}
        onZoomChange={onZoomChange}
      />
      <TileLayer
        url={tileUrl}
        bounds={bounds}
        tileSize={pdfInfo.tileSize}
        noWrap={true}
      />
    </MapContainer>
  );
};