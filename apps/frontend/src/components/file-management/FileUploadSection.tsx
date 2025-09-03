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
        <MenuItem key={folder.id} value={folder.id}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: 1, 
                bgcolor: folder.color || '#gray',
              }} 
            />
            {folder.name} ({folder.file_count} files)
          </Box>
        </MenuItem>
      ))}
    </Select>
  </FormControl>
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
        <MenuItem key={project.id} value={project.id}>
          <Typography variant="body2">
            {project.name}
          </Typography>
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

export const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  uploading,
  onFileUpload,
  fetchFolders,
  fetchProjects,
}) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);

  useEffect((): void => {
    const loadFolders = async (): Promise<void> => {
      setLoadingFolders(true);
      try {
        const folderData = await fetchFolders() as Folder[];
        setFolders(folderData);
      } catch (error) {
        console.error('Failed to load folders:', error);
      } finally {
        setLoadingFolders(false);
      }
    };
    void loadFolders();
  }, [fetchFolders]);

  useEffect((): void => {
    const loadProjects = async (): Promise<void> => {
      setLoadingProjects(true);
      try {
        const projectData = await fetchProjects() as Project[];
        setProjects(projectData);
      } catch (error) {
        console.error('Failed to load projects:', error);
      } finally {
        setLoadingProjects(false);
      }
    };
    void loadProjects();
  }, [fetchProjects]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    void onFileUpload(event, selectedFolder || undefined, selectedProject || undefined);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FolderIcon />
        Upload File
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <ProjectSelect
          projects={projects}
          selectedProject={selectedProject}
          onProjectChange={setSelectedProject}
          loading={loadingProjects}
        />

        <FolderSelect 
          folders={folders}
          selectedFolder={selectedFolder}
          onFolderChange={setSelectedFolder}
          loading={loadingFolders}
        />

        <input
          accept=".csv,.xlsx,.xls,*"
          style={{ display: 'none' }}
          id="file-upload"
          type="file"
          onChange={handleFileUpload}
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
      </Box>
      
      {(selectedProject || selectedFolder) && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          File will be uploaded to:
          {selectedProject && (
            <> Project: <strong>{projects.find((p) => p.id === selectedProject)?.name}</strong></>
          )}
          {selectedProject && selectedFolder && <>, </>}
          {selectedFolder && (
            <> Folder: <strong>{folders.find((f) => f.id === selectedFolder)?.name}</strong></>
          )}
        </Typography>
      )}
    </Box>
  );
};