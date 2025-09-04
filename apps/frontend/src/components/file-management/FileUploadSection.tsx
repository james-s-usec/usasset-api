import React, { useState, useEffect } from 'react';
import { Box, Button, CircularProgress, FormControl, InputLabel, Select, MenuItem, Typography } from '@mui/material';
import { Upload as UploadIcon, Folder as FolderIcon } from '@mui/icons-material';

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

interface FileUploadSectionProps {
  uploading: boolean;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>, folderId?: string, projectId?: string) => Promise<void>;
  fetchFolders: () => Promise<Folder[]>;
  fetchProjects: () => Promise<Project[]>;
}

// Custom hook for managing folders data
const useFolders = (fetchFolders: () => Promise<Folder[]>): { folders: Folder[]; loading: boolean } => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect((): void => {
    const loadFolders = async (): Promise<void> => {
      setLoading(true);
      try {
        const folderData = await fetchFolders();
        setFolders(folderData);
      } catch (error) {
        console.error('Failed to load folders:', error);
      } finally {
        setLoading(false);
      }
    };
    void loadFolders();
  }, [fetchFolders]);

  return { folders, loading };
};

// Custom hook for managing projects data
const useProjects = (fetchProjects: () => Promise<Project[]>): { projects: Project[]; loading: boolean } => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect((): void => {
    const loadProjects = async (): Promise<void> => {
      setLoading(true);
      try {
        const projectData = await fetchProjects();
        setProjects(projectData);
      } catch (error) {
        console.error('Failed to load projects:', error);
      } finally {
        setLoading(false);
      }
    };
    void loadProjects();
  }, [fetchProjects]);

  return { projects, loading };
};

// Helper component for folder color indicator
const FolderColorIndicator: React.FC<{ color: string }> = ({ color }) => (
  <Box 
    sx={{ 
      width: 12, 
      height: 12, 
      borderRadius: 1, 
      bgcolor: color || '#gray',
    }} 
  />
);

// Helper component for folder menu item
const FolderMenuItem: React.FC<{ folder: Folder }> = ({ folder }) => (
  <MenuItem key={folder.id} value={folder.id}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <FolderColorIndicator color={folder.color} />
      {folder.name} ({folder.file_count} files)
    </Box>
  </MenuItem>
);

const FolderSelect: React.FC<{
  folders: Folder[];
  selectedFolder: string;
  onFolderChange: (folderId: string) => void;
  loading: boolean;
}> = ({ folders, selectedFolder, onFolderChange, loading }) => (
  <FormControl sx={{ minWidth: 200 }} size="small">
    <InputLabel id="folder-select-label">Folder (Optional)</InputLabel>
    <Select
      labelId="folder-select-label"
      value={selectedFolder}
      label="Folder (Optional)"
      onChange={(e): void => onFolderChange(e.target.value)}
      disabled={loading}
    >
      <MenuItem value="">
        <em>No Folder</em>
      </MenuItem>
      {folders.map((folder) => (
        <FolderMenuItem key={folder.id} folder={folder} />
      ))}
    </Select>
  </FormControl>
);

// Helper component for project menu item
const ProjectMenuItem: React.FC<{ project: Project }> = ({ project }) => (
  <MenuItem key={project.id} value={project.id}>
    <Typography variant="body2">
      {project.name}
    </Typography>
  </MenuItem>
);

const ProjectSelect: React.FC<{
  projects: Project[];
  selectedProject: string;
  onProjectChange: (projectId: string) => void;
  loading: boolean;
}> = ({ projects, selectedProject, onProjectChange, loading }) => (
  <FormControl sx={{ minWidth: 200 }} size="small">
    <InputLabel id="project-select-label">Project (Optional)</InputLabel>
    <Select
      labelId="project-select-label"
      value={selectedProject}
      label="Project (Optional)"
      onChange={(e): void => onProjectChange(e.target.value)}
      disabled={loading}
    >
      <MenuItem value="">
        <em>No Project</em>
      </MenuItem>
      {projects.map((project) => (
        <ProjectMenuItem key={project.id} project={project} />
      ))}
    </Select>
  </FormControl>
);

// Helper component for project info display
const ProjectInfo: React.FC<{ projectName?: string }> = ({ projectName }) => {
  if (!projectName) return null;
  return <> Project: <strong>{projectName}</strong></>;
};

// Helper component for folder info display
const FolderInfo: React.FC<{ folderName?: string }> = ({ folderName }) => {
  if (!folderName) return null;
  return <> Folder: <strong>{folderName}</strong></>;
};

// Helper component for upload destination info
const UploadDestinationInfo: React.FC<{
  selectedProject: string;
  selectedFolder: string;
  projects: Project[];
  folders: Folder[];
}> = ({ selectedProject, selectedFolder, projects, folders }) => {
  if (!selectedProject && !selectedFolder) return null;

  const selectedProjectName = projects.find((p) => p.id === selectedProject)?.name;
  const selectedFolderName = folders.find((f) => f.id === selectedFolder)?.name;
  const hasBoth = selectedProject && selectedFolder;

  return (
    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
      File will be uploaded to:
      <ProjectInfo projectName={selectedProjectName} />
      {hasBoth && <>, </>}
      <FolderInfo folderName={selectedFolderName} />
    </Typography>
  );
};

// Props interface for UploadControls
interface UploadControlsProps {
  projects: Project[];
  folders: Folder[];
  selectedProject: string;
  selectedFolder: string;
  loadingProjects: boolean;
  loadingFolders: boolean;
  uploading: boolean;
  onProjectChange: (projectId: string) => void;
  onFolderChange: (folderId: string) => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

// Helper component for file input
const FileInput: React.FC<{
  uploading: boolean;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ uploading, onFileUpload }) => (
  <>
    <input
      accept=".csv,.xlsx,.xls,*"
      style={{ display: 'none' }}
      id="file-upload"
      type="file"
      onChange={onFileUpload}
      disabled={uploading}
    />
    <label htmlFor="file-upload">
      <Button
        variant="contained"
        component="span"
        startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
        disabled={uploading}
      >
        {uploading ? 'Uploading...' : 'Upload File'}
      </Button>
    </label>
  </>
);

// Helper component for upload controls
const UploadControls: React.FC<UploadControlsProps> = ({
  projects,
  folders,
  selectedProject,
  selectedFolder,
  loadingProjects,
  loadingFolders,
  uploading,
  onProjectChange,
  onFolderChange,
  onFileUpload
}) => (
  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
    <ProjectSelect
      projects={projects}
      selectedProject={selectedProject}
      onProjectChange={onProjectChange}
      loading={loadingProjects}
    />

    <FolderSelect 
      folders={folders}
      selectedFolder={selectedFolder}
      onFolderChange={onFolderChange}
      loading={loadingFolders}
    />

    <FileInput uploading={uploading} onFileUpload={onFileUpload} />
  </Box>
);

// Helper component for section header
const SectionHeader: React.FC = () => (
  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <FolderIcon />
    Upload File
  </Typography>
);

// Custom hook for selection state
const useSelectionState = (): {
  selectedFolder: string;
  selectedProject: string;
  setSelectedFolder: (value: string) => void;
  setSelectedProject: (value: string) => void;
} => {
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  
  return {
    selectedFolder,
    selectedProject,
    setSelectedFolder,
    setSelectedProject
  };
};

// Props for UploadSectionContent
type UploadContentProps = {
  projects: Project[];
  folders: Folder[];
  selectedProject: string;
  selectedFolder: string;
  loadingProjects: boolean;
  loadingFolders: boolean;
  uploading: boolean;
  onProjectChange: (value: string) => void;
  onFolderChange: (value: string) => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

// Upload section content
const UploadSectionContent: React.FC<UploadContentProps> = (props) => (
  <>
    <UploadControls {...props} />
    <UploadDestinationInfo
      selectedProject={props.selectedProject}
      selectedFolder={props.selectedFolder}
      projects={props.projects}
      folders={props.folders}
    />
  </>
);

// File upload handler
const useFileUploadHandler = (
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>, folderId?: string, projectId?: string) => Promise<void>,
  selection: ReturnType<typeof useSelectionState>
) => {
  return (event: React.ChangeEvent<HTMLInputElement>): void => {
    void onFileUpload(
      event, 
      selection.selectedFolder || undefined, 
      selection.selectedProject || undefined
    );
  };
};

export const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  uploading,
  onFileUpload,
  fetchFolders,
  fetchProjects,
}) => {
  const folders = useFolders(fetchFolders);
  const projects = useProjects(fetchProjects);
  const selection = useSelectionState();
  const handleFileUpload = useFileUploadHandler(onFileUpload, selection);

  return (
    <Box sx={{ mb: 3 }}>
      <SectionHeader />
      <UploadSectionContent
        projects={projects.projects}
        folders={folders.folders}
        selectedProject={selection.selectedProject}
        selectedFolder={selection.selectedFolder}
        loadingProjects={projects.loading}
        loadingFolders={folders.loading}
        uploading={uploading}
        onProjectChange={selection.setSelectedProject}
        onFolderChange={selection.setSelectedFolder}
        onFileUpload={handleFileUpload}
      />
    </Box>
  );
};