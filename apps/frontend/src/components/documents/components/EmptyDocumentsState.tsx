import React from "react";
import { Paper, Typography } from "@mui/material";
import { PictureAsPdf as PdfIcon } from "@mui/icons-material";

export const EmptyDocumentsState: React.FC = () => (
  <Paper sx={{ p: 4, textAlign: "center" }}>
    <PdfIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
    <Typography variant="h6" color="text.secondary">
      No PDF documents found
    </Typography>
    <Typography color="text.secondary">
      Upload some PDF files to get started
    </Typography>
  </Paper>
);
