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
  InputLabel,
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
import { MapContainer, TileLayer } from 'react-leaflet';
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
    return L.extend({}, CRS.Simple, {
      transformation: new L.Transformation(1, 0, 1, 0)
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

  const scale = Math.pow(2, zoom);
  const mapWidth = pdfInfo.dimensions.width * scale;
  const mapHeight = pdfInfo.dimensions.height * scale;
  const bounds = new LatLngBounds([0, 0], [mapHeight, mapWidth]);

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
              label={`${Math.round(scale * 100)}%`} 
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
          crs={createPDFCRS(pdfInfo.dimensions.width, pdfInfo.dimensions.height)}
          center={[mapHeight / 2, mapWidth / 2]}
          zoom={zoom}
          minZoom={0}
          maxZoom={pdfInfo.maxZoom}
          bounds={bounds}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
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