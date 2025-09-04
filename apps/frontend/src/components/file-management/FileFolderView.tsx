import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Avatar,
  Button,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
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

interface FileFolderViewProps {
  files: FileData[];
  folders: Folder[];
  projects: Project[];
  onDownload: (fileId: string) => Promise<void>;
  onDelete: (fileId: string, fileName: string) => Promise<void>;
  onPreview?: (fileId: string) => Promise<string>;
  onRefresh?: () => Promise<void>;
}

const getFileIcon = (mimetype: string): React.ReactElement => {
  if (mimetype === 'application/pdf') return <PdfIcon color="error" />;
  if (mimetype.startsWith('image/')) return <ImageIcon color="primary" />;
  if (mimetype.includes('csv') || mimetype.includes('spreadsheet') || mimetype.includes('excel')) 
    return <CsvIcon color="success" />;
  return <FileIcon color="action" />;
};

const getFileTypeLabel = (mimetype: string): string => {
  if (mimetype === 'application/pdf') return 'PDF';
  if (mimetype.includes('wordprocessingml.document')) return 'DOCX';
  if (mimetype.includes('presentationml.presentation')) return 'PPTX';
  if (mimetype.includes('spreadsheetml.sheet')) return 'XLSX';
  if (mimetype.includes('csv')) return 'CSV';
  if (mimetype.startsWith('image/jpeg')) return 'JPEG';
  if (mimetype.startsWith('image/png')) return 'PNG';
  if (mimetype.startsWith('image/')) return 'Image';
  return 'File';
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FileCard: React.FC<{
  file: FileData;
  onDownload: (fileId: string) => Promise<void>;
  onDelete: (fileId: string, fileName: string) => Promise<void>;
  onPreview?: (fileId: string) => Promise<string>;
}> = ({ file, onDownload, onDelete, onPreview }) => {
  const isImage = file.mimetype.startsWith('image/');
  const isCSV = file.mimetype.includes('csv') || file.original_name.toLowerCase().endsWith('.csv');
  const isPDF = file.mimetype === 'application/pdf';

  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'transparent' }}>
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
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
          <Chip 
            label={getFileTypeLabel(file.mimetype)} 
            size="small" 
            variant="outlined"
            sx={{ fontSize: '0.7rem', height: 20 }}
          />
          {file.project && (
            <Chip 
              label={file.project.name} 
              size="small" 
              color="primary"
              variant="outlined"
              sx={{ fontSize: '0.7rem', height: 20 }}
            />
          )}
        </Box>
      </CardContent>
      
      <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
        <Box sx={{ display: 'flex', gap: 0.5, width: '100%', justifyContent: 'flex-end' }}>
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
      </CardActions>
    </Card>
  );
};

export const FileFolderView: React.FC<FileFolderViewProps> = ({
  files,
  folders,
  projects,
  onDownload,
  onDelete,
  onPreview,
  onRefresh,
}) => {
  // Group files by folder and project
  const groupedData = React.useMemo(() => {
    const groups = new Map<string, { type: 'project' | 'folder' | 'unorganized', data: Project | Folder | null, files: FileData[] }>();
    
    // Initialize groups
    projects.forEach(project => {
      groups.set(`project-${project.id}`, {
        type: 'project',
        data: project,
        files: []
      });
    });
    
    folders.forEach(folder => {
      groups.set(`folder-${folder.id}`, {
        type: 'folder',
        data: folder,
        files: []
      });
    });
    
    groups.set('unorganized', {
      type: 'unorganized',
      data: null,
      files: []
    });
    
    // Group files
    files.forEach(file => {
      if (file.project) {
        const key = `project-${file.project.id}`;
        const group = groups.get(key);
        if (group) {
          group.files.push(file);
        }
      } else if (file.folder) {
        const key = `folder-${file.folder.id}`;
        const group = groups.get(key);
        if (group) {
          group.files.push(file);
        }
      } else {
        groups.get('unorganized')?.files.push(file);
      }
    });
    
    // Filter out empty groups and sort by file count
    return Array.from(groups.entries())
      .filter(([_, group]) => group.files.length > 0)
      .sort(([, a], [, b]) => b.files.length - a.files.length);
  }, [files, folders, projects]);

  const [expandedPanels, setExpandedPanels] = useState<Set<string>>(new Set(['unorganized']));

  const handlePanelChange = (panelId: string): (_event: React.SyntheticEvent, isExpanded: boolean) => void => (_event: React.SyntheticEvent, isExpanded: boolean): void => {
    const newExpanded = new Set(expandedPanels);
    if (isExpanded) {
      newExpanded.add(panelId);
    } else {
      newExpanded.delete(panelId);
    }
    setExpandedPanels(newExpanded);
  };

  const getGroupTitle = (type: string, data: Project | Folder | null): string => {
    switch (type) {
      case 'project':
        return data ? (data as Project).name : 'Unknown Project';
      case 'folder':
        return data ? (data as Folder).name : 'Unknown Folder';
      case 'unorganized':
        return 'Unorganized Files';
      default:
        return 'Unknown';
    }
  };

  const getGroupIcon = (type: string, data: Project | Folder | null): React.ReactElement => {
    switch (type) {
      case 'project':
        return <ProjectIcon color="primary" />;
      case 'folder':
        return data && expandedPanels.has(`folder-${data.id}`) ? 
          <FolderOpenIcon color="primary" /> : 
          <FolderIcon color="primary" />;
      case 'unorganized':
        return <FolderIcon color="disabled" />;
      default:
        return <FileIcon />;
    }
  };

  return (
    <Paper sx={{ mt: 2 }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FolderIcon />
            Folder View
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Files organized by folders and projects
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

      <Box sx={{ p: 2 }}>
        {groupedData.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No files to display
            </Typography>
          </Box>
        ) : (
          groupedData.map(([groupId, group]) => (
            <Accordion
              key={groupId}
              expanded={expandedPanels.has(groupId)}
              onChange={handlePanelChange(groupId)}
              sx={{ mb: 1, '&:before': { display: 'none' } }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  '& .MuiAccordionSummary-content': {
                    alignItems: 'center',
                    gap: 1
                  }
                }}
              >
                {getGroupIcon(group.type, group.data)}
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  {getGroupTitle(group.type, group.data)}
                </Typography>
                <Chip 
                  label={`${group.files.length} file${group.files.length !== 1 ? 's' : ''}`}
                  size="small"
                  color="default"
                />
                {group.type === 'folder' && group.data && (
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: 1,
                      bgcolor: (group.type === 'folder' && group.data && 'color' in group.data ? (group.data as Folder).color : '#gray'),
                      ml: 1,
                    }}
                  />
                )}
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {group.files.map((file) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={file.id}>
                      <FileCard
                        file={file}
                        onDownload={onDownload}
                        onDelete={onDelete}
                        onPreview={onPreview}
                      />
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </Box>
    </Paper>
  );
};