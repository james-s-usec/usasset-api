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

interface FileTreeNodeProps {
  file: FileData;
  level: number;
  onDownload: (fileId: string) => Promise<void>;
  onDelete: (fileId: string, fileName: string) => Promise<void>;
  onPreview?: (fileId: string) => Promise<string>;
}

interface FileActionButtonsProps {
  file: FileData;
  onDownload: (fileId: string) => Promise<void>;
  onDelete: (fileId: string, fileName: string) => Promise<void>;
  onPreview?: (fileId: string) => Promise<string>;
}

const canFileBePreviewedPredicate = (file: FileData): boolean => {
  const isImage = file.mimetype.startsWith('image/');
  const isCSV = file.mimetype.includes('csv') || file.original_name.toLowerCase().endsWith('.csv');
  const isPDF = file.mimetype === 'application/pdf';
  return isImage || isCSV || isPDF;
};

const PreviewButton: React.FC<{
  file: FileData;
  onPreview: (fileId: string) => Promise<string>;
}> = ({ file, onPreview }) => (
  <IconButton
    size="small"
    onClick={() => onPreview(file.id)}
    title="Preview"
  >
    <PreviewIcon fontSize="small" />
  </IconButton>
);

const DownloadButton: React.FC<{
  file: FileData;
  onDownload: (fileId: string) => Promise<void>;
}> = ({ file, onDownload }) => (
  <IconButton
    size="small"
    onClick={() => onDownload(file.id)}
    title="Download"
  >
    <DownloadIcon fontSize="small" />
  </IconButton>
);

const DeleteButton: React.FC<{
  file: FileData;
  onDelete: (fileId: string, fileName: string) => Promise<void>;
}> = ({ file, onDelete }) => (
  <IconButton
    size="small"
    color="error"
    onClick={() => onDelete(file.id, file.original_name)}
    title="Delete"
  >
    <DeleteIcon fontSize="small" />
  </IconButton>
);

const FileActionButtons: React.FC<FileActionButtonsProps> = ({ file, onDownload, onDelete, onPreview }) => {
  const canPreview = canFileBePreviewedPredicate(file) && onPreview;

  return (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      {canPreview && <PreviewButton file={file} onPreview={onPreview} />}
      <DownloadButton file={file} onDownload={onDownload} />
      <DeleteButton file={file} onDelete={onDelete} />
    </Box>
  );
};

const FileTreeNode: React.FC<FileTreeNodeProps> = ({ file, level, onDownload, onDelete, onPreview }) => {
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
        <FileActionButtons
          file={file}
          onDownload={onDownload}
          onDelete={onDelete}
          onPreview={onPreview}
        />
      </ListItemSecondaryAction>
    </ListItem>
  );
};

interface FolderTreeNodeProps {
  folder: Folder;
  files: FileData[];
  level: number;
  onDownload: (fileId: string) => Promise<void>;
  onDelete: (fileId: string, fileName: string) => Promise<void>;
  onPreview?: (fileId: string) => Promise<string>;
}

interface FolderHeaderProps {
  folder: Folder;
  expanded: boolean;
  fileCount: number;
  level: number;
  onClick: () => void;
}

const FolderIconWithIndicator: React.FC<{
  folder: Folder;
  expanded: boolean;
}> = ({ folder, expanded }) => (
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
);

const FolderHeader: React.FC<FolderHeaderProps> = ({ folder, expanded, fileCount, level, onClick }) => (
  <ListItem
    component="div"
    onClick={onClick}
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
      <FolderIconWithIndicator folder={folder} expanded={expanded} />
    </ListItemIcon>
    <ListItemText
      primary={folder.name}
      secondary={`${fileCount} file${fileCount !== 1 ? 's' : ''}`}
    />
  </ListItem>
);

const EmptyFolderMessage: React.FC<{ level: number }> = ({ level }) => (
  <ListItem sx={{ pl: (level + 1) * 2 + 2 }}>
    <ListItemText
      primary={
        <Typography variant="body2" color="text.secondary" fontStyle="italic">
          No files in this folder
        </Typography>
      }
    />
  </ListItem>
);

const FolderFileList: React.FC<{
  files: FileData[];
  level: number;
  onDownload: (fileId: string) => Promise<void>;
  onDelete: (fileId: string, fileName: string) => Promise<void>;
  onPreview?: (fileId: string) => Promise<string>;
}> = ({ files, level, onDownload, onDelete, onPreview }) => (
  <List component="div" disablePadding>
    {files.map((file) => (
      <FileTreeNode
        key={file.id}
        file={file}
        level={level + 1}
        onDownload={onDownload}
        onDelete={onDelete}
        onPreview={onPreview}
      />
    ))}
    {files.length === 0 && <EmptyFolderMessage level={level} />}
  </List>
);

const FolderTreeNode: React.FC<FolderTreeNodeProps> = ({ folder, files, level, onDownload, onDelete, onPreview }) => {
  const [expanded, setExpanded] = useState(false);
  const folderFiles = files.filter(file => file.folder?.id === folder.id);

  const toggleExpanded = (): void => {
    setExpanded(!expanded);
  };

  return (
    <>
      <FolderHeader
        folder={folder}
        expanded={expanded}
        fileCount={folderFiles.length}
        level={level}
        onClick={toggleExpanded}
      />
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <FolderFileList
          files={folderFiles}
          level={level}
          onDownload={onDownload}
          onDelete={onDelete}
          onPreview={onPreview}
        />
      </Collapse>
    </>
  );
};

interface ProjectTreeNodeProps {
  project: Project;
  files: FileData[];
  folders: Folder[];
  onDownload: (fileId: string) => Promise<void>;
  onDelete: (fileId: string, fileName: string) => Promise<void>;
  onPreview?: (fileId: string) => Promise<string>;
}

interface ProjectHeaderProps {
  project: Project;
  expanded: boolean;
  fileCount: number;
  onClick: () => void;
}

const formatProjectSecondaryText = (fileCount: number, description?: string): string => {
  const fileText = `${fileCount} file${fileCount !== 1 ? 's' : ''}`;
  return description ? `${fileText} • ${description}` : fileText;
};

const ProjectHeader: React.FC<ProjectHeaderProps> = ({ project, expanded, fileCount, onClick }) => (
  <ListItem
    component="div"
    onClick={onClick}
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
      secondary={formatProjectSecondaryText(fileCount, project.description)}
    />
  </ListItem>
);

const EmptyProjectMessage: React.FC = () => (
  <ListItem sx={{ pl: 4 }}>
    <ListItemText
      primary={
        <Typography variant="body2" color="text.secondary" fontStyle="italic">
          No files in this project
        </Typography>
      }
    />
  </ListItem>
);

const ProjectFolderList: React.FC<{
  folders: Folder[];
  files: FileData[];
  onDownload: (fileId: string) => Promise<void>;
  onDelete: (fileId: string, fileName: string) => Promise<void>;
  onPreview?: (fileId: string) => Promise<string>;
}> = ({ folders, files, onDownload, onDelete, onPreview }) => (
  <>
    {folders.map((folder) => (
      <FolderTreeNode
        key={folder.id}
        folder={folder}
        files={files}
        level={1}
        onDownload={onDownload}
        onDelete={onDelete}
        onPreview={onPreview}
      />
    ))}
  </>
);

const ProjectFileList: React.FC<{
  files: FileData[];
  onDownload: (fileId: string) => Promise<void>;
  onDelete: (fileId: string, fileName: string) => Promise<void>;
  onPreview?: (fileId: string) => Promise<string>;
}> = ({ files, onDownload, onDelete, onPreview }) => (
  <>
    {files.map((file) => (
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
);

const useProjectData = (project: Project, files: FileData[], folders: Folder[]): {
  projectFiles: FileData[];
  projectFolders: Folder[];
  unorganizedFiles: FileData[];
} => {
  const projectFiles = files.filter(file => file.project?.id === project.id);
  const projectFolders = folders.filter(folder => 
    projectFiles.some(file => file.folder?.id === folder.id)
  );
  const unorganizedFiles = projectFiles.filter(file => !file.folder);
  
  return { projectFiles, projectFolders, unorganizedFiles };
};

const ProjectContent: React.FC<{
  projectFolders: Folder[];
  projectFiles: FileData[];
  unorganizedFiles: FileData[];
  onDownload: (fileId: string) => Promise<void>;
  onDelete: (fileId: string, fileName: string) => Promise<void>;
  onPreview?: (fileId: string) => Promise<string>;
}> = ({ projectFolders, projectFiles, unorganizedFiles, onDownload, onDelete, onPreview }) => (
  <List component="div" disablePadding>
    <ProjectFolderList
      folders={projectFolders}
      files={projectFiles}
      onDownload={onDownload}
      onDelete={onDelete}
      onPreview={onPreview}
    />
    <ProjectFileList
      files={unorganizedFiles}
      onDownload={onDownload}
      onDelete={onDelete}
      onPreview={onPreview}
    />
    {projectFiles.length === 0 && <EmptyProjectMessage />}
  </List>
);

const ProjectTreeNode: React.FC<ProjectTreeNodeProps> = ({ project, files, folders, onDownload, onDelete, onPreview }) => {
  const [expanded, setExpanded] = useState(false);
  const { projectFiles, projectFolders, unorganizedFiles } = useProjectData(project, files, folders);

  const toggleExpanded = (): void => {
    setExpanded(!expanded);
  };

  return (
    <>
      <ProjectHeader
        project={project}
        expanded={expanded}
        fileCount={projectFiles.length}
        onClick={toggleExpanded}
      />
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <ProjectContent
          projectFolders={projectFolders}
          projectFiles={projectFiles}
          unorganizedFiles={unorganizedFiles}
          onDownload={onDownload}
          onDelete={onDelete}
          onPreview={onPreview}
        />
      </Collapse>
    </>
  );
};

interface TreeHeaderProps {
  onRefresh?: () => Promise<void>;
}

const TreeHeaderTitle: React.FC = () => (
  <Box>
    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <ProjectIcon />
      File Tree View
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Files organized by Project → Folder hierarchy
    </Typography>
  </Box>
);

const RefreshButton: React.FC<{ onRefresh: () => Promise<void> }> = ({ onRefresh }) => (
  <Button
    variant="outlined"
    size="small"
    startIcon={<RefreshIcon />}
    onClick={onRefresh}
  >
    Refresh
  </Button>
);

const TreeHeader: React.FC<TreeHeaderProps> = ({ onRefresh }) => (
  <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <TreeHeaderTitle />
    {onRefresh && <RefreshButton onRefresh={onRefresh} />}
  </Box>
);

interface UnassignedSectionProps {
  folders: Folder[];
  files: FileData[];
  onDownload: (fileId: string) => Promise<void>;
  onDelete: (fileId: string, fileName: string) => Promise<void>;
  onPreview?: (fileId: string) => Promise<string>;
}

const UnassignedSectionHeader: React.FC<{ fileCount: number }> = ({ fileCount }) => (
  <ListItem>
    <ListItemIcon>
      <ProjectIcon color="disabled" />
    </ListItemIcon>
    <ListItemText
      primary="Unassigned Files"
      secondary={`${fileCount} file${fileCount !== 1 ? 's' : ''} without project assignment`}
    />
  </ListItem>
);

const UnassignedFolders: React.FC<{
  folders: Folder[];
  files: FileData[];
  onDownload: (fileId: string) => Promise<void>;
  onDelete: (fileId: string, fileName: string) => Promise<void>;
  onPreview?: (fileId: string) => Promise<string>;
}> = ({ folders, files, onDownload, onDelete, onPreview }) => (
  <>
    {folders.map((folder) => (
      <FolderTreeNode
        key={folder.id}
        folder={folder}
        files={files}
        level={1}
        onDownload={onDownload}
        onDelete={onDelete}
        onPreview={onPreview}
      />
    ))}
  </>
);

const OrphanFiles: React.FC<{
  files: FileData[];
  onDownload: (fileId: string) => Promise<void>;
  onDelete: (fileId: string, fileName: string) => Promise<void>;
  onPreview?: (fileId: string) => Promise<string>;
}> = ({ files, onDownload, onDelete, onPreview }) => (
  <>
    {files.filter(file => !file.folder).map((file) => (
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
);

const UnassignedSection: React.FC<UnassignedSectionProps> = ({ folders, files, onDownload, onDelete, onPreview }) => (
  <>
    <Divider sx={{ my: 1 }} />
    <UnassignedSectionHeader fileCount={files.length} />
    <UnassignedFolders folders={folders} files={files} onDownload={onDownload}
onDelete={onDelete} onPreview={onPreview} />
    <OrphanFiles files={files} onDownload={onDownload} onDelete={onDelete}
onPreview={onPreview} />
  </>
);

const EmptyTreeMessage: React.FC = () => (
  <ListItem>
    <ListItemText
      primary={
        <Typography variant="body2" color="text.secondary" textAlign="center">
          No files uploaded yet. Upload your first file to get started.
        </Typography>
      }
    />
  </ListItem>
);

const useFileTreeData = (files: FileData[], folders: Folder[]): {
  unassignedFiles: FileData[];
  unassignedFolders: Folder[];
  hasUnassignedFiles: boolean;
} => {
  const unassignedFiles = files.filter(file => !file.project);
  const unassignedFolders = folders.filter(folder =>
    unassignedFiles.some(file => file.folder?.id === folder.id)
  );
  const hasUnassignedFiles = unassignedFolders.length > 0 || unassignedFiles.some(file => !file.folder);
  
  return { unassignedFiles, unassignedFolders, hasUnassignedFiles };
};

const ProjectList: React.FC<{
  projects: Project[];
  files: FileData[];
  folders: Folder[];
  onDownload: (fileId: string) => Promise<void>;
  onDelete: (fileId: string, fileName: string) => Promise<void>;
  onPreview?: (fileId: string) => Promise<string>;
}> = ({ projects, files, folders, onDownload, onDelete, onPreview }) => (
  <>
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
  </>
);

const TreeContent: React.FC<{
  projects: Project[];
  files: FileData[];
  folders: Folder[];
  unassignedFiles: FileData[];
  unassignedFolders: Folder[];
  hasUnassignedFiles: boolean;
  onDownload: (fileId: string) => Promise<void>;
  onDelete: (fileId: string, fileName: string) => Promise<void>;
  onPreview?: (fileId: string) => Promise<string>;
}> = ({ projects, files, folders, unassignedFiles, unassignedFolders, hasUnassignedFiles, onDownload, onDelete, onPreview }) => (
  <List sx={{ maxHeight: 600, overflow: 'auto' }}>
    <ProjectList
      projects={projects}
      files={files}
      folders={folders}
      onDownload={onDownload}
      onDelete={onDelete}
      onPreview={onPreview}
    />

    {hasUnassignedFiles && (
      <UnassignedSection
        folders={unassignedFolders}
        files={unassignedFiles}
        onDownload={onDownload}
        onDelete={onDelete}
        onPreview={onPreview}
      />
    )}

    {files.length === 0 && <EmptyTreeMessage />}
  </List>
);

export const FileTreeView: React.FC<FileTreeViewProps> = ({
  files,
  folders,
  projects,
  onDownload,
  onDelete,
  onPreview,
  onRefresh,
}) => {
  const { unassignedFiles, unassignedFolders, hasUnassignedFiles } = useFileTreeData(files, folders);

  return (
    <Paper sx={{ mt: 2 }}>
      <TreeHeader onRefresh={onRefresh} />
      <TreeContent
        projects={projects}
        files={files}
        folders={folders}
        unassignedFiles={unassignedFiles}
        unassignedFolders={unassignedFolders}
        hasUnassignedFiles={hasUnassignedFiles}
        onDownload={onDownload}
        onDelete={onDelete}
        onPreview={onPreview}
      />
    </Paper>
  );
};