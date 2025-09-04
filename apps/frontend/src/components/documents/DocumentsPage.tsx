import React, { useState } from "react";
import { Container, Typography } from "@mui/material";
import { usePdfFiles } from "./components/usePdfFiles";
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
}> = ({ pdfFiles, loading, onFileSelect }) => {
  if (loading) {
    return <LoadingState />;
  }

  if (pdfFiles.length === 0) {
    return <EmptyDocumentsState />;
  }

  return <PDFGrid files={pdfFiles} onFileSelect={onFileSelect} />;
};

export const DocumentsPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<PDFFile | null>(null);
  const { pdfFiles, loading } = usePdfFiles();

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
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <DocumentsHeader />
      <DocumentsContent
        pdfFiles={pdfFiles}
        loading={loading}
        onFileSelect={handleFileSelect}
      />
    </Container>
  );
};
