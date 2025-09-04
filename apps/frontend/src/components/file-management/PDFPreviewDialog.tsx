import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { config } from '../../config';

// Fix Leaflet default marker icons in React
interface LeafletIconDefault extends L.Icon.Default {
  _getIconUrl?: string;
}
delete (L.Icon.Default.prototype as LeafletIconDefault)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface PDFPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  fileId: string;
  fileName: string;
  loading: boolean;
  getPdfInfo?: (fileId: string) => Promise<PDFInfo>;
}

interface PDFInfo {
  pageCount: number;
  title?: string;
  dimensions: { width: number; height: number };
  maxZoom: number;
  tileSize: number;
}

const DialogHeader: React.FC<{ fileName: string; onClose: () => void }> = ({ fileName, onClose }) => (
  <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    {fileName}
    <IconButton onClick={onClose}>
      <CloseIcon />
    </IconButton>
  </DialogTitle>
);

const LoadingMessage: React.FC = () => (
  <Box sx={{ textAlign: 'center', py: 4 }}>
    <Typography>Loading PDF...</Typography>
  </Box>
);

const ErrorMessage: React.FC<{ error: string | null }> = ({ error }) => (
  <Box sx={{ textAlign: 'center', py: 4 }}>
    <Typography color="error">{error || 'Failed to load PDF'}</Typography>
  </Box>
);

const FitBoundsOnLoad: React.FC<{ bounds: L.LatLngBoundsExpression }> = ({ bounds }) => {
  const map = useMapEvents({});
  
  React.useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds);
    }
  }, [bounds, map]);
  
  return null;
};

const usePDFCRS = (height: number): L.CRS => {
  return L.extend({}, L.CRS.Simple, {
    transformation: new L.Transformation(1, 0, -1, height),
  });
};

const PDFMapContainer: React.FC<{
  pdfCRS: L.CRS;
  bounds: L.LatLngBounds;
  pdfInfo: PDFInfo;
  tileUrl: string;
}> = ({ pdfCRS, bounds, pdfInfo, tileUrl }) => (
  <MapContainer
    crs={pdfCRS}
    bounds={bounds}
    zoom={1}
    minZoom={0}
    maxZoom={pdfInfo.maxZoom}
    style={{ height: '100%', width: '100%' }}
    zoomControl={true}
    attributionControl={false}
  >
    <FitBoundsOnLoad bounds={bounds} />
    <TileLayer
      url={tileUrl}
      tileSize={pdfInfo.tileSize}
      noWrap={true}
      bounds={bounds}
      maxZoom={pdfInfo.maxZoom}
      minZoom={0}
    />
  </MapContainer>
);

const PDFMapView: React.FC<{
  fileId: string;
  pdfInfo: PDFInfo;
}> = ({ fileId, pdfInfo }) => {
  const pdfCRS = usePDFCRS(pdfInfo.dimensions.height);
  const bounds = L.latLngBounds([0, 0], [pdfInfo.dimensions.height, pdfInfo.dimensions.width]);
  const tileUrl = `${config.api.baseUrl}/api/files/${fileId}/pdf-tiles/1/{z}/{x}/{y}.png`;

  return (
    <Box sx={{ height: { xs: '60vh', sm: '70vh' }, width: '100%' }}>
      <PDFMapContainer pdfCRS={pdfCRS} bounds={bounds} pdfInfo={pdfInfo}
        tileUrl={tileUrl} />
    </Box>
  );
};

const PDFLeafletViewer: React.FC<{ fileId: string; getPdfInfo: (fileId: string) => Promise<PDFInfo> }> = ({ fileId, getPdfInfo }) => {
  const [pdfInfo, setPdfInfo] = useState<PDFInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPdfInfo = async (): Promise<void> => {
      try {
        const info = await getPdfInfo(fileId);
        setPdfInfo(info);
      } catch (err) {
        console.error('Error loading PDF info:', err);
        setError('Failed to load PDF information');
      } finally {
        setLoading(false);
      }
    };

    if (fileId) {
      loadPdfInfo();
    }
  }, [fileId, getPdfInfo]);

  if (loading) return <LoadingMessage />;
  if (error || !pdfInfo) return <ErrorMessage error={error} />;
  
  return <PDFMapView fileId={fileId} pdfInfo={pdfInfo} />;
};

const createDefaultGetPdfInfo = (): ((fileId: string) => Promise<PDFInfo>) => 
  (): Promise<PDFInfo> => Promise.reject(new Error('getPdfInfo not provided'));

const DialogLoadingContent: React.FC = () => (
  <Box sx={{ textAlign: 'center', py: 4 }}>
    <Typography>Loading...</Typography>
  </Box>
);

export const PDFPreviewDialog: React.FC<PDFPreviewDialogProps> = ({
  open,
  onClose,
  fileId,
  fileName,
  loading: externalLoading,
  getPdfInfo,
}) => (
  <Dialog 
    open={open} 
    onClose={onClose} 
    maxWidth="xl" 
    fullWidth
  >
    <DialogHeader fileName={fileName} onClose={onClose} />
    <DialogContent>
      {externalLoading ? (
        <DialogLoadingContent />
      ) : (
        <PDFLeafletViewer 
          fileId={fileId} 
          getPdfInfo={getPdfInfo || createDefaultGetPdfInfo()} 
        />
      )}
    </DialogContent>
  </Dialog>
);