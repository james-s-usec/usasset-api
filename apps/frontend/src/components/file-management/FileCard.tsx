import React from "react";
import {
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Avatar,
  Typography,
  Box,
} from "@mui/material";
import {
  InsertDriveFile as FileIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  TableChart as CsvIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Visibility as PreviewIcon,
} from "@mui/icons-material";
import type { FileData } from "./types";

const getFileIcon = (mimetype: string): React.ReactElement => {
  if (mimetype === "application/pdf") return <PdfIcon color="error" />;
  if (mimetype.startsWith("image/")) return <ImageIcon color="primary" />;
  if (mimetype.includes("csv") || mimetype.includes("spreadsheet") || mimetype.includes("excel")) 
    return <CsvIcon color="success" />;
  return <FileIcon color="action" />;
};

const getFileTypeLabel = (mimetype: string): string => {
  if (mimetype === "application/pdf") return "PDF";
  if (mimetype.includes("wordprocessingml.document")) return "DOCX";
  if (mimetype.includes("presentationml.presentation")) return "PPTX";
  if (mimetype.includes("spreadsheetml.sheet")) return "XLSX";
  if (mimetype.includes("csv")) return "CSV";
  if (mimetype.startsWith("image/jpeg")) return "JPEG";
  if (mimetype.startsWith("image/png")) return "PNG";
  if (mimetype.startsWith("image/")) return "Image";
  return "File";
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

interface FileCardProps {
  file: FileData;
  onDownload: (fileId: string) => Promise<void>;
  onDelete: (fileId: string, fileName: string) => Promise<void>;
  onPreview?: (fileId: string) => Promise<string>;
}

const FileInfo: React.FC<{ file: FileData }> = ({ file }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
    <Avatar sx={{ width: 32, height: 32, bgcolor: "transparent" }}>
      {getFileIcon(file.mimetype)}
    </Avatar>
    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
      <Typography 
        variant="body2" 
        fontWeight="medium" 
        noWrap 
        title={file.original_name}
      >
        {file.original_name}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {formatFileSize(file.size)}
      </Typography>
    </Box>
  </Box>
);

const FileChips: React.FC<{ file: FileData }> = ({ file }) => (
  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
    <Chip 
      label={getFileTypeLabel(file.mimetype)} 
      size="small" 
      variant="outlined"
      sx={{ fontSize: "0.7rem", height: 20 }}
    />
    {file.project && (
      <Chip 
        label={file.project.name} 
        size="small" 
        color="primary"
        variant="outlined"
        sx={{ fontSize: "0.7rem", height: 20 }}
      />
    )}
  </Box>
);

const FileActions: React.FC<{
  file: FileData;
  onDownload: (fileId: string) => Promise<void>;
  onDelete: (fileId: string, fileName: string) => Promise<void>;
  onPreview?: (fileId: string) => Promise<string>;
}> = ({ file, onDownload, onDelete, onPreview }) => {
  const isImage = file.mimetype.startsWith("image/");
  const isCSV = file.mimetype.includes("csv") || file.original_name.toLowerCase().endsWith(".csv");
  const isPDF = file.mimetype === "application/pdf";
  const canPreview = isImage || isCSV || isPDF;

  return (
    <Box sx={{ display: "flex", gap: 0.5, width: "100%", justifyContent: "flex-end" }}>
      {canPreview && onPreview && (
        <IconButton
          size="small"
          onClick={() => onPreview(file.id)}
          title="Preview"
        >
          <PreviewIcon fontSize="small" />
        </IconButton>
      )}
      <IconButton
        size="small"
        onClick={() => onDownload(file.id)}
        title="Download"
      >
        <DownloadIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        color="error"
        onClick={() => onDelete(file.id, file.original_name)}
        title="Delete"
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

export const FileCard: React.FC<FileCardProps> = ({ file, onDownload, onDelete, onPreview }) => (
  <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
    <CardContent sx={{ flexGrow: 1, pb: 1 }}>
      <FileInfo file={file} />
      <FileChips file={file} />
    </CardContent>
    <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
      <FileActions 
        file={file}
        onDownload={onDownload}
        onDelete={onDelete}
        onPreview={onPreview}
      />
    </CardActions>
  </Card>
);
