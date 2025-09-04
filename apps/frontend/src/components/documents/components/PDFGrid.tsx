import React from "react";
import { Grid } from "@mui/material";
import { PDFCard } from "./PDFCard";

interface PDFFile {
  id: string;
  original_name: string;
  size: number;
  created_at: string;
  pageCount?: number;
  mimetype?: string;
}

interface PDFGridProps {
  files: PDFFile[];
  onFileSelect: (file: PDFFile) => void;
}

export const PDFGrid: React.FC<PDFGridProps> = ({ files, onFileSelect }) => (
  <Grid container spacing={3}>
    {files.map((file) => (
      <Grid key={file.id} size={{ xs: 12, sm: 6, md: 4 }}>
        <PDFCard file={file} onView={onFileSelect} />
      </Grid>
    ))}
  </Grid>
);
