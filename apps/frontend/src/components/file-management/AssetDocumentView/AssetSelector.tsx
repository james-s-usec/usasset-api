import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';
import { FILE_TYPE_LABELS } from '../../../types/document.types';
import type { Asset, SelectionState } from './types';
import type { FileType } from '../../../types/document.types';

interface AssetSelectorProps {
  projects: Array<{ id: string; name: string }>;
  assets: Asset[];
  selection: SelectionState;
  uploading: boolean;
  onProjectChange: (projectId: string) => void;
  onAssetChange: (assetId: string) => void;
  onFileTypeChange: (fileType: FileType) => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ProjectSelector: React.FC<{
  value: string;
  projects: Array<{ id: string; name: string }>;
  onChange: (projectId: string) => void;
}> = ({ value, projects, onChange }) => (
  <FormControl fullWidth size="small">
    <InputLabel>Project</InputLabel>
    <Select
      value={value}
      onChange={(e: SelectChangeEvent): void => onChange(e.target.value)}
      label="Project"
    >
      {projects.map((p) => (
        <MenuItem key={p.id} value={p.id}>
          {p.name}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

const AssetSelect: React.FC<{
  value: string;
  assets: Asset[];
  disabled: boolean;
  onChange: (assetId: string) => void;
}> = ({ value, assets, disabled, onChange }) => (
  <FormControl fullWidth size="small" disabled={disabled}>
    <InputLabel>Asset</InputLabel>
    <Select
      value={value}
      onChange={(e: SelectChangeEvent): void => onChange(e.target.value)}
      label="Asset"
    >
      {assets.map((a) => (
        <MenuItem key={a.id} value={a.id}>
          {a.assetTag} - {a.name}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

const FileTypeSelect: React.FC<{
  value: FileType;
  disabled: boolean;
  onChange: (fileType: FileType) => void;
}> = ({ value, disabled, onChange }) => (
  <FormControl fullWidth size="small" disabled={disabled}>
    <InputLabel>File Type</InputLabel>
    <Select
      value={value}
      onChange={(e: SelectChangeEvent): void => onChange(e.target.value as FileType)}
      label="File Type"
    >
      {Object.entries(FILE_TYPE_LABELS).map(([v, label]) => (
        <MenuItem key={v} value={v}>
          {label}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

const UploadButton: React.FC<{
  disabled: boolean;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ disabled, onUpload }) => (
  <>
    <input
      accept="*"
      style={{ display: 'none' }}
      id="asset-file-upload"
      type="file"
      onChange={onUpload}
      disabled={disabled}
    />
    <label htmlFor="asset-file-upload">
      <Button
        variant="contained"
        component="span"
        disabled={disabled}
        startIcon={<UploadIcon />}
        fullWidth
      >
        Upload Document
      </Button>
    </label>
  </>
);

const SelectorContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
    {children}
  </Box>
);

const ProjectAssetSelectors: React.FC<{
  projects: Array<{ id: string; name: string }>;
  assets: Asset[];
  selection: SelectionState;
  onProjectChange: (projectId: string) => void;
  onAssetChange: (assetId: string) => void;
}> = ({ projects, assets, selection, onProjectChange, onAssetChange }) => (
  <>
    <SelectorContainer>
      <ProjectSelector
        value={selection.selectedProject}
        projects={projects}
        onChange={onProjectChange}
      />
    </SelectorContainer>
    <SelectorContainer>
      <AssetSelect
        value={selection.selectedAsset}
        assets={assets}
        disabled={!selection.selectedProject}
        onChange={onAssetChange}
      />
    </SelectorContainer>
  </>
);

const FileUploadSelectors: React.FC<{
  selection: SelectionState;
  uploading: boolean;
  onFileTypeChange: (fileType: FileType) => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ selection, uploading, onFileTypeChange, onFileUpload }) => (
  <>
    <SelectorContainer>
      <FileTypeSelect
        value={selection.selectedFileType}
        disabled={!selection.selectedAsset}
        onChange={onFileTypeChange}
      />
    </SelectorContainer>
    <SelectorContainer>
      <UploadButton
        disabled={!selection.selectedAsset || uploading}
        onUpload={onFileUpload}
      />
    </SelectorContainer>
  </>
);

const SelectorGrid: React.FC<AssetSelectorProps> = (props) => (
  <>
    <ProjectAssetSelectors 
      projects={props.projects}
      assets={props.assets}
      selection={props.selection}
      onProjectChange={props.onProjectChange}
      onAssetChange={props.onAssetChange}
    />
    <FileUploadSelectors
      selection={props.selection}
      uploading={props.uploading}
      onFileTypeChange={props.onFileTypeChange}
      onFileUpload={props.onFileUpload}
    />
  </>
);

export const AssetSelector: React.FC<AssetSelectorProps> = (props) => (
  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
    <SelectorGrid {...props} />
  </Box>
);