import React from 'react';
import { MapContainer, ImageOverlay, useMapEvents } from 'react-leaflet';
import L, { LatLngBounds } from 'leaflet';
import { config } from '../../config';
import { PDFMapEventHandler } from './PDFMapEventHandler';

interface PDFMapContainerProps {
  fileId: string;
  currentPage: number;
  pdfInfo: {
    maxZoom: number;
    tileSize: number;
    dimensions: { width: number; height: number };
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
  imageWidth: number, 
  imageHeight: number, 
  bounds: LatLngBounds
): MapProps => ({
  crs: L.CRS.Simple, // Use simple CRS for ImageOverlay
  center: [imageHeight / 2, imageWidth / 2] as [number, number],
  zoom: 1, // Start at a reasonable zoom level
  minZoom: -2, // Allow zooming out significantly  
  maxZoom: 6, // Allow zooming in much more for high-res 2048px images
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount, ignore bounds/map changes
  
  return null;
};

// Simplified component - now under 30 lines
export const PDFMapContainer: React.FC<PDFMapContainerProps> = ({
  fileId,
  currentPage,
  pdfInfo,
  zoom,
  onZoomChange
}) => {
  // Calculate aspect ratio and dimensions
  const aspectRatio = pdfInfo.dimensions.width / pdfInfo.dimensions.height;
  const imageWidth = 2048;
  const imageHeight = imageWidth / aspectRatio;
  
  // Create bounds and props  
  const imageBounds = new L.LatLngBounds([0, 0], [imageHeight, imageWidth]);
  const mapProps = getMapProps(imageWidth, imageHeight, imageBounds);
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
        key={`${fileId}-page-${currentPage}`}
        url={imageUrl}
        bounds={imageBounds}
      />
    </MapContainer>
  );
};