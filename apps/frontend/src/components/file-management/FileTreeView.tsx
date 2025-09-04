import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Button,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  Assignment as ProjectIcon,
  InsertDriveFile as FileIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  TableChart as CsvIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Visibility as PreviewIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import type { FileData } from './types';

interface Folder {
  id: string;
  name: string;
  color: string;
  is_default: boolean;
  file_count: number;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
}

interface FileTreeViewProps {
  files: FileData[];
  folders: Folder[];
  projects: Project[];
  onDownload: (fileId: string) => Promise<void>;
  onDelete: (fileId: string, fileName: string) => Promise<void>;
  onMoveToFolder?: (fileId: string, folderId: string | null) => Promise<void>;
  onMoveToProject?: (fileId: string, projectId: string | null) => Promise<void>;
  onPreview?: (fileId: string) => Promise<string>;
  getFileContent?: (fileId: string) => Promise<string>;
  getPdfInfo?: (fileId: string) => Promise<{
    pageCount: number;
    title?: string;
    author?: string;
    dimensions: { width: number; height: number };
    maxZoom: number;
    tileSize: number;
  }>;
  onRefresh?: () => Promise<void>;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};


const getFileIcon = (mimetype: string): React.ReactElement => {
  if (mimetype === 'application/pdf') return <PdfIcon color="error" />;
  if (mimetype.startsWith('image/')) return <ImageIcon color="primary" />;
  if (mimetype.includes('csv') || mimetype.includes('spreadsheet') || mimetype.includes('excel')) return <CsvIcon color="success" />;
  return <FileIcon color="action" />;
};

const FileTreeNode: React.FC<{
  file: FileData;
  level: number;
  onDownload: (fileId: string) => Promise<void>;
  onDelete: (fileId: string, fileName: string) => Promise<void>;
  onPreview?: (fileId: string) => Promise<string>;
}> = ({ file, level, onDownload, onDelete, onPreview }) => {
  const isImage = file.mimetype.startsWith('image/');
  const isCSV = file.mimetype.includes('csv') || file.original_name.toLowerCase().endsWith('.csv');
  const isPDF = file.mimetype === 'application/pdf';
  
  return (
    <ListItem
      sx={{
        pl: level * 2 + 2,
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <ListItemIcon>
        {getFileIcon(file.mimetype)}
      </ListItemIcon>
      <ListItemText
        primary={file.original_name}
        secondary={`${file.mimetype} • ${formatFileSize(file.size)}`}
      />
      <ListItemSecondaryAction>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {(isImage || isCSV || isPDF) && onPreview && (
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
      </ListItemSecondaryAction>
    </ListItem>
  );
};

const FolderTreeNode: React.FC<{
  folder: Folder;
  files: FileData[];
  level: number;
  onDownload: (fileId: string) => Promise<void>;
  onDelete: (fileId: string, fileName: string) => Promise<void>;
  onPreview?: (fileId: string) => Promise<string>;
}> = ({ folder, files, level, onDownload, onDelete, onPreview }) => {
  const [expanded, setExpanded] = useState(false);
  const folderFiles = files.filter(file => file.folder?.id === folder.id);

  return (
    <>
      <ListItem
        component="div"
        onClick={() => setExpanded(!expanded)}
        sx={{
          pl: level * 2 + 1,
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <ListItemIcon>
          {expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
        </ListItemIcon>
        <ListItemIcon>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {expanded ? <FolderOpenIcon color="primary" /> : <FolderIcon color="primary" />}
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: 1,
                bgcolor: folder.color || '#gray',
              }}
            />
          </Box>
        </ListItemIcon>
        <ListItemText
          primary={folder.name}
          secondary={`${folderFiles.length} file${folderFiles.length !== 1 ? 's' : ''}`}
        />
      </ListItem>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {folderFiles.map((file) => (
            <FileTreeNode
              key={file.id}
              file={file}
              level={level + 1}
              onDownload={onDownload}
              onDelete={onDelete}
              onPreview={onPreview}
            />
          ))}
          {folderFiles.length === 0 && (
            <ListItem sx={{ pl: (level + 1) * 2 + 2 }}>
              <ListItemText
                primary={
                  <Typography variant="body2" color="text.secondary" fontStyle="italic">
                    No files in this folder
                  </Typography>
                }
              />
            </ListItem>
          )}
        </List>
      </Collapse>
    </>
  );
};

const ProjectTreeNode: React.FC<{
  project: Project;
  files: FileData[];
  folders: Folder[];
  onDownload: (fileId: string) => Promise<void>;
  onDelete: (fileId: string, fileName: string) => Promise<void>;
  onPreview?: (fileId: string) => Promise<string>;
}> = ({ project, files, folders, onDownload, onDelete, onPreview }) => {
  const [expanded, setExpanded] = useState(false);
  const projectFiles = files.filter(file => file.project?.id === project.id);
  const projectFolders = folders.filter(folder => 
    projectFiles.some(file => file.folder?.id === folder.id)
  );
  const unorganizedFiles = projectFiles.filter(file => !file.folder);

  return (
    <>
      <ListItem
        component="div"
        onClick={() => setExpanded(!expanded)}
        sx={{
          pl: 1,
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <ListItemIcon>
          {expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
        </ListItemIcon>
        <ListItemIcon>
          <ProjectIcon color="primary" />
        </ListItemIcon>
        <ListItemText
          primary={project.name}
          secondary={`${projectFiles.length} file${projectFiles.length !== 1 ? 's' : ''} ${project.description ? '• ' + project.description : ''}`}
        />
      </ListItem>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {projectFolders.map((folder) => (
            <FolderTreeNode
              key={folder.id}
              folder={folder}
              files={projectFiles}
              level={1}
              onDownload={onDownload}
              onDelete={onDelete}
              onPreview={onPreview}
            />
          ))}
          {unorganizedFiles.map((file) => (
            <FileTreeNode
              key={file.id}
              file={file}
              level={1}
              onDownload={onDownload}
              onDelete={onDelete}
              onPreview={onPreview}
            />
          ))}
          {projectFiles.length === 0 && (
            <ListItem sx={{ pl: 4 }}>
              <ListItemText
                primary={
                  <Typography variant="body2" color="text.secondary" fontStyle="italic">
                    No files in this project
                  </Typography>
                }
              />
            </ListItem>
          )}
        </List>
      </Collapse>
    </>
  );
};

export const FileTreeView: React.FC<FileTreeViewProps> = ({
  files,
  folders,
  projects,
  onDownload,
  onDelete,
  onPreview,
  onRefresh,
}) => {
  const unassignedFiles = files.filter(file => !file.project);
  const unassignedFolders = folders.filter(folder =>
    unassignedFiles.some(file => file.folder?.id === folder.id)
  );
  const orphanedFiles = unassignedFiles.filter(file => !file.folder);

  return (
    <Paper sx={{ mt: 2 }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ProjectIcon />
            File Tree View
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Files organized by Project → Folder hierarchy
          </Typography>
        </Box>
        {onRefresh && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
          >
            Refresh
          </Button>
        )}
      </Box>
      
      <List sx={{ maxHeight: 600, overflow: 'auto' }}>
        {/* Project-based files */}
        {projects.map((project) => (
          <ProjectTreeNode
            key={project.id}
            project={project}
            files={files}
            folders={folders}
            onDownload={onDownload}
            onDelete={onDelete}
            onPreview={onPreview}
          />
        ))}

        {/* Unassigned files section */}
        {(unassignedFolders.length > 0 || orphanedFiles.length > 0) && (
          <>
            <Divider sx={{ my: 1 }} />
            <ListItem>
              <ListItemIcon>
                <ProjectIcon color="disabled" />
              </ListItemIcon>
              <ListItemText
                primary="Unassigned Files"
                secondary={`${unassignedFiles.length} file${unassignedFiles.length !== 1 ? 's' : ''} without project assignment`}
              />
            </ListItem>
            
            {unassignedFolders.map((folder) => (
              <FolderTreeNode
                key={folder.id}
                folder={folder}
                files={unassignedFiles}
                level={1}
                onDownload={onDownload}
                onDelete={onDelete}
                onPreview={onPreview}
              />
            ))}
            
            {orphanedFiles.map((file) => (
              <FileTreeNode
                key={file.id}
                file={file}
                level={1}
                onDownload={onDownload}
                onDelete={onDelete}
                onPreview={onPreview}
              />
            ))}
          </>
        )}

        {files.length === 0 && (
          <ListItem>
            <ListItemText
              primary={
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  No files uploaded yet. Upload your first file to get started.
                </Typography>
              }
            />
          </ListItem>
        )}
      </List>
    </Paper>
  );
};