import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Toolbar,
  Select,
  MenuItem,
  FormControl,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  NavigateBefore,
  NavigateNext,
  FirstPage,
  LastPage,
  FitScreen,
} from '@mui/icons-material';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import L, { CRS, LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { config } from '../../config';

interface PDFViewerProps {
  fileId: string;
  fileName: string;
}

interface PDFInfo {
  pageCount: number;
  title?: string;
  dimensions: { width: number; height: number };
  maxZoom: number;
  tileSize: number;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ fileId, fileName }) => {
  const [pdfInfo, setPdfInfo] = useState<PDFInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPdfInfo();
  }, [fileId]);

  const loadPdfInfo = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch(`${config.api.baseUrl}/api/files/${fileId}/pdf-info`);
      const result = await response.json();
      
      if (result.success) {
        setPdfInfo(result.data);
        setError(null);
      } else {
        setError('Failed to load PDF information');
      }
    } catch (err) {
      setError('Failed to load PDF information');
    } finally {
      setLoading(false);
    }
  };

  const createPDFCRS = (width: number, height: number) => {
    // Standard PDF coordinate system: use original dimensions
    // Backend renders at 4x, so we need to account for that in transformation
    const scale = 1/4; // Scale down from 4x backend rendering to logical size
    return L.extend({}, CRS.Simple, {
      transformation: new L.Transformation(scale, 0, -scale, height * scale)
    });
  };

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

  // Component to handle map events and sync zoom state
  const MapEventHandler: React.FC = () => {
    const map = useMapEvents({
      zoomend: () => {
        setZoom(map.getZoom());
      }
    });
    
    // Sync zoom when our state changes
    React.useEffect(() => {
      if (map.getZoom() !== zoom) {
        map.setZoom(zoom);
      }
    }, [zoom, map]);
    
    return null;
  };


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading PDF...</Typography>
      </Box>
    );
  }

  if (error || !pdfInfo) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error">{error || 'Failed to load PDF'}</Typography>
      </Paper>
    );
  }

  // Use logical PDF dimensions (divide backend 4x scale back to original)
  const logicalWidth = pdfInfo.dimensions.width / 4;
  const logicalHeight = pdfInfo.dimensions.height / 4;
  const bounds = new LatLngBounds([0, 0], [logicalHeight, logicalWidth]);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <Paper elevation={2}>
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} noWrap>
            {fileName}
          </Typography>
          
          <Chip 
            label={`Page ${currentPage} of ${pdfInfo.pageCount}`} 
            variant="outlined" 
            size="small"
          />
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={() => handlePageChange(1)} disabled={currentPage === 1}>
              <FirstPage />
            </IconButton>
            <IconButton onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
              <NavigateBefore />
            </IconButton>
            
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <Select
                value={currentPage}
                onChange={(e) => handlePageChange(Number(e.target.value))}
                variant="outlined"
              >
                {Array.from({ length: pdfInfo.pageCount }, (_, i) => (
                  <MenuItem key={i + 1} value={i + 1}>
                    {i + 1}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <IconButton onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === pdfInfo.pageCount}>
              <NavigateNext />
            </IconButton>
            <IconButton onClick={() => handlePageChange(pdfInfo.pageCount)} disabled={currentPage === pdfInfo.pageCount}>
              <LastPage />
            </IconButton>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <IconButton onClick={handleZoomOut} disabled={zoom <= 0}>
              <ZoomOut />
            </IconButton>
            
            <Chip 
              label={`${Math.round(Math.pow(2, zoom) * 100)}%`} 
              variant="outlined" 
              size="small"
              sx={{ minWidth: 60 }}
            />
            
            <IconButton onClick={handleZoomIn} disabled={zoom >= pdfInfo.maxZoom}>
              <ZoomIn />
            </IconButton>
            
            <IconButton onClick={handleFitToScreen}>
              <FitScreen />
            </IconButton>
          </Box>
        </Toolbar>
      </Paper>

      {/* PDF Viewer - Leaflet Map with Tiles */}
      <Box sx={{ flexGrow: 1, position: 'relative' }}>
        <MapContainer
          crs={createPDFCRS(logicalWidth, logicalHeight)}
          center={[logicalHeight / 2, logicalWidth / 2]}
          zoom={0}
          minZoom={0}
          maxZoom={pdfInfo.maxZoom}
          bounds={bounds}
          maxBounds={bounds}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <MapEventHandler />
          <TileLayer
            url={`${config.api.baseUrl}/api/files/${fileId}/pdf-tiles/${currentPage}/{z}/{x}/{y}.png`}
            bounds={bounds}
            tileSize={pdfInfo.tileSize}
            noWrap={true}
          />
        </MapContainer>
      </Box>
    </Box>
  );
};