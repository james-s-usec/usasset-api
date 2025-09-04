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

export const PDFMapContainer: React.FC<PDFMapContainerProps> = ({
  fileId,
  currentPage,
  logicalWidth,
  logicalHeight,
  bounds,
  pdfInfo,
  zoom,
  onZoomChange
}) => (
  <MapContainer
    crs={createPDFCRS(logicalWidth, logicalHeight)}
    center={[logicalHeight / 2, logicalWidth / 2]}
    zoom={1}
    minZoom={0}
    maxZoom={pdfInfo.maxZoom}
    bounds={bounds}
    maxBounds={bounds}
    style={{ width: '100%', height: '100%' }}
    zoomControl={false}
    attributionControl={false}
  >
    <PDFMapEventHandler
      pdfInfo={pdfInfo}
      bounds={bounds}
      zoom={zoom}
      onZoomChange={onZoomChange}
    />
    <TileLayer
      url={`${config.api.baseUrl}/api/files/${fileId}/pdf-tiles/${currentPage}/{z}/{x}/{y}.png`}
      bounds={bounds}
      tileSize={pdfInfo.tileSize}
      noWrap={true}
    />
  </MapContainer>
);