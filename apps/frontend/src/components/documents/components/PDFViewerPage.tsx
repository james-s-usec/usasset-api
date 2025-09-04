import React from "react";
import { Container, Button } from "@mui/material";
import { PDFViewer } from "../PDFViewer";

interface PDFFile {
  id: string;
  original_name: string;
  size: number;
  created_at: string;
  pageCount?: number;
  mimetype?: string;
}

interface PDFViewerPageProps {
  selectedFile: PDFFile;
  onBack: () => void;
}

export const PDFViewerPage: React.FC<PDFViewerPageProps> = ({ selectedFile, onBack }) => (
  <Container maxWidth="xl" sx={{ py: 4 }}>
    <Button 
      onClick={onBack}
      sx={{ mb: 2 }}
      variant="outlined"
    >
      ← Back to Documents
    </Button>
    <PDFViewer fileId={selectedFile.id} fileName={selectedFile.original_name} />
  </Container>
);
