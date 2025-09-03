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
// Leaflet dependencies not available - PDF preview disabled
// import { MapContainer, TileLayer } from 'react-leaflet';
// import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';
import { config } from '../../config';

// Stub for build
const L: any = { 
  CRS: { Simple: {} }, 
  bounds: () => ({}),
  Icon: { Default: { prototype: {}, mergeOptions: () => {} } }
};
const MapContainer: any = () => null;
const TileLayer: any = () => null;

// Fix Leaflet default marker icons in React (disabled)
// delete (L.Icon.Default.prototype as any)._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
//   iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
//   shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
// });

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

const PDFLeafletViewer: React.FC<{ fileId: string; getPdfInfo: (fileId: string) => Promise<PDFInfo> }> = ({ fileId, getPdfInfo }) => {
  const [pdfInfo, setPdfInfo] = useState<PDFInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPdfInfo = async () => {
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

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography>Loading PDF...</Typography>
      </Box>
    );
  }

  if (error || !pdfInfo) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="error">{error || 'Failed to load PDF'}</Typography>
      </Box>
    );
  }

  // Define custom CRS for PDF coordinates
  const pdfCRS = L.extend({}, L.CRS.Simple, {
    transformation: new L.Transformation(1, 0, -1, pdfInfo.dimensions.height),
  });

  // Calculate bounds based on PDF dimensions
  const bounds = L.latLngBounds(
    [0, 0],
    [pdfInfo.dimensions.height, pdfInfo.dimensions.width]
  );

  const tileUrl = `${config.api.baseUrl}/api/files/${fileId}/pdf-tiles/1/{z}/{x}/{y}.png`;

  return (
    <Box sx={{ height: '70vh', width: '100%' }}>
      <MapContainer
        crs={pdfCRS}
        bounds={bounds}
        zoom={0}
        minZoom={0}
        maxZoom={pdfInfo.maxZoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          url={tileUrl}
          tileSize={pdfInfo.tileSize}
          noWrap={true}
          bounds={bounds}
          maxZoom={pdfInfo.maxZoom}
          minZoom={0}
        />
      </MapContainer>
    </Box>
  );
};

const createDefaultGetPdfInfo = (): ((fileId: string) => Promise<PDFInfo>) => 
  (): Promise<PDFInfo> => Promise.reject(new Error('getPdfInfo not provided'));

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
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography>Loading...</Typography>
        </Box>
      ) : (
        <PDFLeafletViewer 
          fileId={fileId} 
          getPdfInfo={getPdfInfo || createDefaultGetPdfInfo()} 
        />
      )}
    </DialogContent>
  </Dialog>
);