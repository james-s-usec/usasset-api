import React from "react";
import { Typography } from "@mui/material";
import { PictureAsPdf as PdfIcon } from "@mui/icons-material";

export const DocumentsHeader: React.FC = () => (
  <>
    <Typography variant="h4" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <PdfIcon fontSize="large" />
      Documents
    </Typography>
    
    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
      Browse and view PDF documents with full-page zoom and pan capabilities.
    </Typography>
  </>
);
