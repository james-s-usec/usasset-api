import React from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Box,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Description as DocumentIcon,
} from '@mui/icons-material';
import { FILE_TYPE_LABELS, FILE_TYPE_COLORS } from '../../../types/document.types';
import type { AssetDocument, FileType } from '../../../types/document.types';

interface DocumentListProps {
  documents: AssetDocument[];
  onDownload: (fileId: string) => void;
  onDelete: (documentId: string) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const DocumentListItem: React.FC<{
  doc: AssetDocument;
  onDownload: () => void;
  onDelete: () => void;
}> = ({ doc, onDownload, onDelete }) => (
  <ListItem divider>
    <ListItemText
      primary={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {doc.original_name}
          <Chip
            label={FILE_TYPE_LABELS[doc.file_type as FileType] || doc.file_type}
            size="small"
            sx={{
              backgroundColor: FILE_TYPE_COLORS[doc.file_type as FileType] || '#607D8B',
              color: 'white'
            }}
          />
        </Box>
      }
      secondary={`${formatFileSize(doc.size)} • Uploaded ${new Date(doc.created_at).toLocaleDateString()}`}
    />
    <ListItemSecondaryAction>
      <IconButton
        edge="end"
        aria-label="download"
        onClick={onDownload}
        sx={{ mr: 1 }}
      >
        <DownloadIcon />
      </IconButton>
      <IconButton edge="end" aria-label="delete" onClick={onDelete}>
        <DeleteIcon />
      </IconButton>
    </ListItemSecondaryAction>
  </ListItem>
);

export const DocumentList: React.FC<DocumentListProps> = ({ documents, onDownload, onDelete }) => (
  <Paper sx={{ p: 2 }}>
    <Typography variant="h6" gutterBottom>
      <DocumentIcon
        sx={{ mr: 1, verticalAlign: 'middle' }}
      />
      Documents ({documents.length})
    </Typography>

    <List>
      {documents.length === 0 ? (
        <ListItem>
          <ListItemText
            primary="No documents uploaded"
            secondary="Upload documents using the button above"
          />
        </ListItem>
      ) : (
        documents.map((doc) => (
          <DocumentListItem
            key={doc.id}
            doc={doc}
            onDownload={(): void => onDownload(doc.id)}
            onDelete={(): void => onDelete(doc.id)}
          />
        ))
      )}
    </List>
  </Paper>
);