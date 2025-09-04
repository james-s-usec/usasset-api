import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Box,
  Chip,
} from '@mui/material';
import { 
  PictureAsPdf as PdfIcon,
  Visibility as ViewIcon 
} from '@mui/icons-material';
import { PDFViewer } from './PDFViewer';
import { config } from '../../config';

interface PDFFile {
  id: string;
  original_name: string;
  size: number;
  created_at: string;
  pageCount?: number;
  mimetype?: string;
}

interface FileResponse {
  success: boolean;
  data: {
    files: PDFFile[];
  };
}

export const DocumentsPage: React.FC = () => {
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<PDFFile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPdfFiles();
  }, []);

  const fetchPdfFiles = async (): Promise<void> => {
    try {
      const response = await fetch(`${config.api.baseUrl}/api/files?limit=50`);
      const result = await response.json();
      
      if (result.success) {
        const pdfs = (result as FileResponse).data.files.filter((file) => 
          file.mimetype === 'application/pdf'
        );
        
        // Get page count for each PDF
        const pdfsWithPageCount = await Promise.all(
          pdfs.map(async (pdf) => {
            try {
              const infoResponse = await fetch(`${config.api.baseUrl}/api/files/${pdf.id}/pdf-info`);
              const infoResult = await infoResponse.json();
              return {
                ...pdf,
                pageCount: infoResult.success ? infoResult.data.pageCount : undefined,
              };
            } catch {
              return pdf;
            }
          })
        );
        
        setPdfFiles(pdfsWithPageCount);
      }
    } catch (error) {
      console.error('Failed to fetch PDF files:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  if (selectedFile) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Button 
          onClick={() => setSelectedFile(null)}
          sx={{ mb: 2 }}
          variant="outlined"
        >
          ← Back to Documents
        </Button>
        <PDFViewer fileId={selectedFile.id} fileName={selectedFile.original_name} />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <PdfIcon fontSize="large" />
        Documents
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Browse and view PDF documents with full-page zoom and pan capabilities.
      </Typography>

      {loading ? (
        <Typography>Loading documents...</Typography>
      ) : pdfFiles.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <PdfIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No PDF documents found
          </Typography>
          <Typography color="text.secondary">
            Upload some PDF files to get started
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {pdfFiles.map((file) => (
            <Grid key={file.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia sx={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
                  <PdfIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                </CardMedia>
                
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom noWrap
title={file.original_name}>
                    {file.original_name}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <Chip 
                      size="small" 
                      label={formatFileSize(file.size)} 
                      variant="outlined" 
                    />
                    {file.pageCount && (
                      <Chip 
                        size="small" 
                        label={`${file.pageCount} pages`} 
                        variant="outlined" 
                      />
                    )}
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary">
                    Uploaded: {formatDate(file.created_at)}
                  </Typography>
                </CardContent>
                
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<ViewIcon />}
                    onClick={() => setSelectedFile(file)}
                    variant="contained"
                    fullWidth
                  >
                    View Document
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};