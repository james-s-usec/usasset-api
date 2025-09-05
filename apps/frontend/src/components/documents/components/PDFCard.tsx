import React from "react";
import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Typography,
  Box,
  Chip,
} from "@mui/material";
import { PictureAsPdf as PdfIcon, Visibility as ViewIcon, CheckCircle as ValidateIcon } from "@mui/icons-material";
import { formatFileSize, formatDate } from "./formatters";

interface PDFFile {
  id: string;
  original_name: string;
  size: number;
  created_at: string;
  pageCount?: number;
  mimetype?: string;
}

interface PDFCardProps {
  file: PDFFile;
  onView: (file: PDFFile) => void;
  onValidate?: (file: PDFFile) => void;
}

const PDFCardMedia: React.FC = () => (
  <CardMedia sx={{ 
    height: 120, 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    bgcolor: "grey.100" 
  }}>
    <PdfIcon sx={{ fontSize: 48, color: "text.secondary" }} />
  </CardMedia>
);

const PDFCardContent: React.FC<{ file: PDFFile }> = ({ file }) => (
  <CardContent sx={{ flexGrow: 1 }}>
    <Typography 
      variant="h6" 
      gutterBottom 
      noWrap 
      title={file.original_name}
    >
      {file.original_name}
    </Typography>
    
    <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
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
);

const PDFCardActions: React.FC<{ 
  onView: () => void; 
  onValidate?: () => void; 
}> = ({ onView, onValidate }) => (
  <CardActions sx={{ flexDirection: 'column', gap: 1 }}>
    <Button
      size="small"
      startIcon={<ViewIcon />}
      onClick={onView}
      variant="contained"
      fullWidth
    >
      View Document
    </Button>
    {onValidate && (
      <Button
        size="small"
        startIcon={<ValidateIcon />}
        onClick={onValidate}
        variant="outlined"
        fullWidth
        color="secondary"
      >
        Validate Pages
      </Button>
    )}
  </CardActions>
);

export const PDFCard: React.FC<PDFCardProps> = ({ file, onView, onValidate }) => (
  <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
    <PDFCardMedia />
    <PDFCardContent file={file} />
    <PDFCardActions 
      onView={(): void => onView(file)} 
      onValidate={onValidate ? (): void => onValidate(file) : undefined}
    />
  </Card>
);
