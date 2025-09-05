import React, { useState } from "react";
import { Container, Typography } from "@mui/material";
import { usePdfFiles } from "./components/usePdfFiles";
import { DocumentsHeader } from "./components/DocumentsHeader";
import { EmptyDocumentsState } from "./components/EmptyDocumentsState";
import { PDFGrid } from "./components/PDFGrid";
import { PDFViewerPage } from "./components/PDFViewerPage";
import { ValidationDialog } from "./components/ValidationDialog";
import { useValidation } from "./hooks/useValidation";

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





const DocumentsMainView: React.FC<{
  pdfFiles: PDFFile[];
  loading: boolean;
  validation: ReturnType<typeof useValidation>;
  onFileSelect: (file: PDFFile) => void;
}> = ({ pdfFiles, loading, validation, onFileSelect }) => (
  <>
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <DocumentsHeader />
      <DocumentsContent
        pdfFiles={pdfFiles}
        loading={loading}
        onFileSelect={onFileSelect}
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
    <DocumentsMainView
      pdfFiles={pdfFiles}
      loading={loading}
      validation={validation}
      onFileSelect={handleFileSelect}
    />
  );
};
