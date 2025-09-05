import React, { useState, useRef } from "react";
import { Container, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Chip, Box, LinearProgress, CircularProgress, Button } from "@mui/material";
import { usePdfFiles } from "./components/usePdfFiles";
import { config } from "../../config";
import { DocumentsHeader } from "./components/DocumentsHeader";
import { EmptyDocumentsState } from "./components/EmptyDocumentsState";
import { PDFGrid } from "./components/PDFGrid";
import { PDFViewerPage } from "./components/PDFViewerPage";

interface PDFFile {
  id: string;
  original_name: string;
  size: number;
  created_at: string;
  pageCount?: number;
  mimetype?: string;
}

const LoadingState: React.FC = () => (
  <Typography>Loading documents...</Typography>
);

const DocumentsContent: React.FC<{
  pdfFiles: PDFFile[];
  loading: boolean;
  onFileSelect: (file: PDFFile) => void;
  onFileValidate: (file: PDFFile) => void;
}> = ({ pdfFiles, loading, onFileSelect, onFileValidate }) => {
  if (loading) {
    return <LoadingState />;
  }

  if (pdfFiles.length === 0) {
    return <EmptyDocumentsState />;
  }

  return <PDFGrid files={pdfFiles} onFileSelect={onFileSelect} onFileValidate={onFileValidate} />;
};

interface ValidationResult {
  totalPages: number;
  validPages: number[];
  invalidPages: Array<{ page: number; error: string }>;
}

const ValidationDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onCancel: () => void;
  isValidating: boolean;
  validatingFile: string;
  validationResult: ValidationResult | null;
  validationProgress: { current: number; total: number };
}> = ({ open, onClose, onCancel, isValidating, validatingFile, validationResult, validationProgress }) => (
  <Dialog 
    open={open} 
    onClose={!isValidating ? onClose : undefined} 
    maxWidth="sm" 
    fullWidth
  >
    <DialogTitle>
      {isValidating ? `Validating: ${validatingFile}` : `PDF Validation Results: ${validatingFile}`}
    </DialogTitle>
    <DialogContent>
      {isValidating ? (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CircularProgress size={24} sx={{ mr: 2 }} />
            <Typography>
              Validating pages... This may take 10-30 seconds for complex PDFs.
            </Typography>
          </Box>
          <LinearProgress 
            variant="indeterminate" 
            sx={{ mb: 2, height: 8, borderRadius: 4 }}
          />
          <Typography variant="body2" color="text.secondary" align="center">
            Testing {validationProgress.total} pages for rendering errors
          </Typography>
        </Box>
      ) : validationResult ? (
        <Box>
          <Alert severity="info" sx={{ mb: 2 }}>
            Total Pages: {validationResult.totalPages}
          </Alert>
          
          {validationResult.validPages.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" color="success.main" sx={{ mb: 1 }}>
                ✅ Valid Pages ({validationResult.validPages.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {validationResult.validPages.map(page => (
                  <Chip 
                    key={page} 
                    label={`Page ${page}`} 
                    color="success" 
                    size="small" 
                  />
                ))}
              </Box>
            </Box>
          )}
          
          {validationResult.invalidPages.length > 0 && (
            <Box>
              <Typography variant="h6" color="error.main" sx={{ mb: 1 }}>
                ❌ Pages with Errors ({validationResult.invalidPages.length})
              </Typography>
              {validationResult.invalidPages.map(({ page, error }) => (
                <Alert key={page} severity="error" sx={{ mb: 1 }}>
                  <strong>Page {page}:</strong> {error}
                </Alert>
              ))}
            </Box>
          )}
        </Box>
      ) : null}
    </DialogContent>
    {isValidating && (
      <DialogActions>
        <Button onClick={onCancel} color="error" variant="outlined">
          Cancel Validation
        </Button>
      </DialogActions>
    )}
  </Dialog>
);

interface ValidationHook {
  validationResult: ValidationResult | null;
  validationDialog: boolean;
  setValidationDialog: (open: boolean) => void;
  validatingFile: string;
  validationProgress: { current: number; total: number };
  isValidating: boolean;
  handleFileValidate: (file: PDFFile) => Promise<void>;
  handleCancelValidation: () => void;
}

const useValidation = (): ValidationHook => {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [validationDialog, setValidationDialog] = useState(false);
  const [validatingFile, setValidatingFile] = useState<string>("");
  const [validationProgress, setValidationProgress] = useState({ current: 0, total: 0 });
  const [isValidating, setIsValidating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleFileValidate = async (file: PDFFile): Promise<void> => {
    setValidatingFile(file.original_name);
    setIsValidating(true);
    setValidationDialog(true);
    setValidationResult(null);
    
    // Create abort controller for cancellation
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    // Get page count first to show progress
    const pageCount = file.pageCount || 12; // fallback to 12 if not known
    setValidationProgress({ current: 0, total: pageCount });
    
    try {
      const response = await fetch(`${config.api.baseUrl}/api/files/${file.id}/pdf-validate`, {
        signal: abortController.signal
      });
      const result = await response.json();
      if (result.success) {
        setValidationResult(result.data);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Validation cancelled by user');
      } else {
        console.error('Validation failed:', error);
      }
    } finally {
      setIsValidating(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelValidation = (): void => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsValidating(false);
      setValidationDialog(false);
    }
  };

  return {
    validationResult,
    validationDialog,
    setValidationDialog,
    validatingFile,
    validationProgress,
    isValidating,
    handleFileValidate,
    handleCancelValidation,
  };
};

export const DocumentsPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<PDFFile | null>(null);
  const { pdfFiles, loading } = usePdfFiles();
  const validation = useValidation();

  const handleFileSelect = (file: PDFFile): void => {
    setSelectedFile(file);
  };

  const handleBackToDocuments = (): void => {
    setSelectedFile(null);
  };

  if (selectedFile) {
    return (
      <PDFViewerPage 
        selectedFile={selectedFile} 
        onBack={handleBackToDocuments} 
      />
    );
  }

  return (
    <>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <DocumentsHeader />
        <DocumentsContent
          pdfFiles={pdfFiles}
          loading={loading}
          onFileSelect={handleFileSelect}
          onFileValidate={validation.handleFileValidate}
        />
      </Container>
      
      <ValidationDialog 
        open={validation.validationDialog}
        onClose={() => validation.setValidationDialog(false)}
        onCancel={validation.handleCancelValidation}
        isValidating={validation.isValidating}
        validatingFile={validation.validatingFile}
        validationResult={validation.validationResult}
        validationProgress={validation.validationProgress}
      />
    </>
  );
};
