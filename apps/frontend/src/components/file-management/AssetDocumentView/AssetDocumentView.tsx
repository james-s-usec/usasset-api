import React, { useState, useEffect, useCallback } from 'react';
import { Box, Paper } from '@mui/material';
import { documentService } from '../../../services/documentService';
import { apiService } from '../../../services/api';
import { AssetSelector } from './AssetSelector';
import { DocumentList } from './DocumentList';
import { AssetNotesPanel } from './AssetNotes';
import type { AssetDocumentViewProps, Asset, SelectionState, DocumentsState } from './types';
import type { AssetNotes, FileType } from '../../../types/document.types';

const useAssetLoader = (setState: React.Dispatch<React.SetStateAction<DocumentsState>>): ((projectId: string) => Promise<void>) => 
  useCallback(async (projectId: string): Promise<void> => {
    try {
      // Load ALL assets for now to debug filtering issues
      // TODO: When ready for production, filter by projectId: `/api/projects/${projectId}/assets`
      const response = await apiService.get<{ success: boolean; data: { assets: Asset[]; pagination: unknown } }>(
        `/api/assets`
      );
      console.log('🔍 All assets loaded for project', projectId, ':', response.data.assets?.length);
      console.log('🔍 Assets data:', response.data.assets);
      setState((prev) => ({ ...prev, assets: response.data.assets || [] }));
    } catch (error) {
      console.error('Failed to load assets for project', projectId, ':', error);
    }
  }, [setState]);

const useDocumentLoader = (setState: React.Dispatch<React.SetStateAction<DocumentsState>>): ((projectId: string, assetId: string) => Promise<void>) => 
  useCallback(async (projectId: string, assetId: string): Promise<void> => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const docs = await documentService.getAssetDocuments(projectId, assetId);
      setState((prev) => ({ ...prev, documents: docs }));
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [setState]);

const useNotesLoader = (setState: React.Dispatch<React.SetStateAction<DocumentsState>>): ((projectId: string, assetId: string) => Promise<void>) => 
  useCallback(async (projectId: string, assetId: string): Promise<void> => {
    try {
      const assetNotes = await documentService.getAssetNotes(projectId, assetId);
      setState((prev) => ({ ...prev, notes: assetNotes }));
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  }, [setState]);


const useFileUploadHandler = (
  selection: SelectionState,
  setState: React.Dispatch<React.SetStateAction<DocumentsState>>,
  loadDocs: (projectId: string, assetId: string) => Promise<void>
): ((event: React.ChangeEvent<HTMLInputElement>) => Promise<void>) => {
  return useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
      const file = event.target.files?.[0];
      if (!file || !selection.selectedProject || !selection.selectedAsset) return;

      setState(prev => ({ ...prev, uploading: true }));
      try {
        await documentService.uploadAssetDocument(
          selection.selectedProject,
          selection.selectedAsset,
          file,
          selection.selectedFileType
        );
        await loadDocs(selection.selectedProject, selection.selectedAsset);
      } catch (error) {
        console.error('Upload failed:', error);
      } finally {
        setState(prev => ({ ...prev, uploading: false }));
        event.target.value = '';
      }
    },
    [selection, setState, loadDocs]
  );
};

const useDocumentDeleteHandler = (
  selection: SelectionState,
  loadDocs: (projectId: string, assetId: string) => Promise<void>
): ((documentId: string) => Promise<void>) => {
  return useCallback(
    async (documentId: string): Promise<void> => {
      if (!selection.selectedProject || !selection.selectedAsset) return;

      try {
        await documentService.deleteAssetDocument(
          selection.selectedProject,
          selection.selectedAsset,
          documentId
        );
        await loadDocs(selection.selectedProject, selection.selectedAsset);
      } catch (error) {
        console.error('Delete failed:', error);
      }
    },
    [selection, loadDocs]
  );
};

interface AssetDocumentState {
  selection: SelectionState;
  setSelection: React.Dispatch<React.SetStateAction<SelectionState>>;
  state: DocumentsState;
  setState: React.Dispatch<React.SetStateAction<DocumentsState>>;
  loadAssets: (projectId: string) => Promise<void>;
  loadDocs: (projectId: string, assetId: string) => Promise<void>;
  loadNotes: (projectId: string, assetId: string) => Promise<void>;
}

const useAssetDocumentState = (): AssetDocumentState => {
  const [selection, setSelection] = useState<SelectionState>({
    selectedProject: '',
    selectedAsset: '',
    selectedFileType: 'DOCUMENT' as FileType,
  });

  const [state, setState] = useState<DocumentsState>({
    documents: [],
    notes: {},
    assets: [],
    loading: false,
    uploading: false,
  });

  const loadAssets = useAssetLoader(setState);
  const loadDocs = useDocumentLoader(setState);
  const loadNotes = useNotesLoader(setState);

  return { selection, setSelection, state, setState, loadAssets, loadDocs, loadNotes };
};

interface EffectsConfig {
  preSelectedAssetId: string | undefined;
  selection: SelectionState;
  setSelection: React.Dispatch<React.SetStateAction<SelectionState>>;
  setState: React.Dispatch<React.SetStateAction<DocumentsState>>;
  loadAssets: (projectId: string) => Promise<void>;
  loadDocs: (projectId: string, assetId: string) => Promise<void>;
  loadNotes: (projectId: string, assetId: string) => Promise<void>;
}

const usePreSelectedAssetEffect = (config: EffectsConfig): void => {
  const { preSelectedAssetId, loadAssets, setState, setSelection } = config;
  
  useEffect(() => {
    if (preSelectedAssetId) {
      loadAssets('').then(() => {
        setState(prevState => {
          const asset = prevState.assets.find(a => a.id === preSelectedAssetId);
          if (asset) {
            setSelection(prev => ({
              ...prev,
              selectedAsset: asset.id,
              selectedProject: asset.projectId || '',
            }));
          }
          return prevState;
        });
      });
    }
  }, [preSelectedAssetId, loadAssets, setSelection, setState]);
};

const useProjectAssetsEffect = (config: EffectsConfig): void => {
  const { selection, preSelectedAssetId, loadAssets } = config;
  
  useEffect(() => {
    if (selection.selectedProject && !preSelectedAssetId) {
      void loadAssets(selection.selectedProject);
    }
  }, [selection.selectedProject, loadAssets, preSelectedAssetId]);
};

const useAssetDocumentsEffect = (config: EffectsConfig): void => {
  const { selection, loadDocs, loadNotes } = config;
  
  useEffect(() => {
    if (selection.selectedAsset && selection.selectedProject) {
      void loadDocs(selection.selectedProject, selection.selectedAsset);
      void loadNotes(selection.selectedProject, selection.selectedAsset);
    }
  }, [selection.selectedAsset, selection.selectedProject, loadDocs, loadNotes]);
};


const useProjectChangeHandler = (
  setSelection: React.Dispatch<React.SetStateAction<SelectionState>>,
  setState: React.Dispatch<React.SetStateAction<DocumentsState>>
): ((projectId: string) => void) => {
  return useCallback((projectId: string): void => {
    setSelection(prev => ({ ...prev, selectedProject: projectId, selectedAsset: '' }));
    setState(prev => ({ ...prev, documents: [], notes: {} }));
  }, [setSelection, setState]);
};

const useAssetChangeHandler = (
  setSelection: React.Dispatch<React.SetStateAction<SelectionState>>
): ((assetId: string) => void) => {
  return useCallback((assetId: string): void => {
    setSelection(prev => ({ ...prev, selectedAsset: assetId }));
  }, [setSelection]);
};

const useFileTypeChangeHandler = (
  setSelection: React.Dispatch<React.SetStateAction<SelectionState>>
): ((fileType: FileType) => void) => {
  return useCallback((fileType: FileType): void => {
    setSelection(prev => ({ ...prev, selectedFileType: fileType }));
  }, [setSelection]);
};

const useNoteSaveHandler = (
  selection: SelectionState,
  setState: React.Dispatch<React.SetStateAction<DocumentsState>>
): ((noteField: keyof AssetNotes, value: string) => Promise<void>) => {
  return useCallback(
    async (noteField: keyof AssetNotes, value: string): Promise<void> => {
      if (!selection.selectedProject || !selection.selectedAsset) return;

      try {
        const updatedNotes = await documentService.updateAssetNotes(
          selection.selectedProject,
          selection.selectedAsset,
          { [noteField]: value }
        );
        setState(prev => ({ ...prev, notes: updatedNotes }));
      } catch (error) {
        console.error('Failed to save note:', error);
      }
    },
    [selection, setState]
  );
};

const AssetSelectorSection: React.FC<{
  preSelectedAssetId?: string;
  projects: Array<{ id: string; name: string }>;
  state: DocumentsState;
  selection: SelectionState;
  handleProjectChange: (projectId: string) => void;
  handleAssetChange: (assetId: string) => void;
  handleFileTypeChange: (fileType: FileType) => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}> = ({ 
  preSelectedAssetId, 
  projects, 
  state, 
  selection, 
  handleProjectChange, 
  handleAssetChange, 
  handleFileTypeChange, 
  handleFileUpload 
}) => {
  if (preSelectedAssetId) return null;
  
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <AssetSelector
        projects={projects}
        assets={state.assets}
        selection={selection}
        uploading={state.uploading}
        onProjectChange={handleProjectChange}
        onAssetChange={handleAssetChange}
        onFileTypeChange={handleFileTypeChange}
        onFileUpload={handleFileUpload}
      />
    </Paper>
  );
};

const AssetContentSection: React.FC<{
  selection: SelectionState;
  state: DocumentsState;
  onFileDownload: (fileId: string) => Promise<void>;
  handleDeleteDocument: (documentId: string) => Promise<void>;
  handleNoteSave: (noteField: keyof AssetNotes, value: string) => Promise<void>;
}> = ({ selection, state, onFileDownload, handleDeleteDocument, handleNoteSave }) => {
  if (!selection.selectedAsset) return null;
  
  return (
    <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
      <Box sx={{ flex: { md: '2 1 0' } }}>
        <DocumentList
          documents={state.documents}
          onDownload={onFileDownload}
          onDelete={handleDeleteDocument}
        />
      </Box>
      <Box sx={{ flex: { md: '1 1 0' } }}>
        <AssetNotesPanel notes={state.notes} onNoteSave={handleNoteSave} />
      </Box>
    </Box>
  );
};

interface DocumentHandlers {
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleDeleteDocument: (documentId: string) => Promise<void>;
  handleProjectChange: (projectId: string) => void;
  handleAssetChange: (assetId: string) => void;
  handleFileTypeChange: (fileType: FileType) => void;
  handleNoteSave: (noteField: keyof AssetNotes, value: string) => Promise<void>;
}

const useAssetDocumentHandlers = (
  selection: SelectionState,
  setSelection: React.Dispatch<React.SetStateAction<SelectionState>>,
  setState: React.Dispatch<React.SetStateAction<DocumentsState>>,
  loadDocs: (projectId: string, assetId: string) => Promise<void>
): DocumentHandlers => {
  const handleFileUpload = useFileUploadHandler(selection, setState, loadDocs);
  const handleDeleteDocument = useDocumentDeleteHandler(selection, loadDocs);
  const handleProjectChange = useProjectChangeHandler(setSelection, setState);
  const handleAssetChange = useAssetChangeHandler(setSelection);
  const handleFileTypeChange = useFileTypeChangeHandler(setSelection);
  const handleNoteSave = useNoteSaveHandler(selection, setState);

  return {
    handleFileUpload,
    handleDeleteDocument,
    handleProjectChange,
    handleAssetChange,
    handleFileTypeChange,
    handleNoteSave,
  };
};

const AssetDocumentViewContent: React.FC<{
  preSelectedAssetId?: string;
  projects: Array<{ id: string; name: string }>;
  onFileDownload: (fileId: string) => Promise<void>;
  selection: SelectionState;
  state: DocumentsState;
  handlers: DocumentHandlers;
}> = ({ preSelectedAssetId, projects, onFileDownload, selection, state, handlers }) => (
  <Box>
    <AssetSelectorSection 
      preSelectedAssetId={preSelectedAssetId}
      projects={projects}
      state={state}
      selection={selection}
      handleProjectChange={handlers.handleProjectChange}
      handleAssetChange={handlers.handleAssetChange}
      handleFileTypeChange={handlers.handleFileTypeChange}
      handleFileUpload={handlers.handleFileUpload}
    />
    <AssetContentSection 
      selection={selection}
      state={state}
      onFileDownload={onFileDownload}
      handleDeleteDocument={handlers.handleDeleteDocument}
      handleNoteSave={handlers.handleNoteSave}
    />
  </Box>
);

export const AssetDocumentView: React.FC<AssetDocumentViewProps> = ({ 
  projects = [], 
  onFileDownload = async (): Promise<void> => {},
  preSelectedAssetId 
}) => {
  const { selection, setSelection, state, setState, loadAssets, loadDocs, loadNotes } = useAssetDocumentState();
  const handlers = useAssetDocumentHandlers(selection, setSelection, setState, loadDocs);

  const effectsConfig: EffectsConfig = {
    preSelectedAssetId,
    selection,
    setSelection,
    setState,
    loadAssets,
    loadDocs,
    loadNotes,
  };

  usePreSelectedAssetEffect(effectsConfig);
  useProjectAssetsEffect(effectsConfig);
  useAssetDocumentsEffect(effectsConfig);

  return (
    <AssetDocumentViewContent 
      preSelectedAssetId={preSelectedAssetId}
      projects={projects}
      onFileDownload={onFileDownload}
      selection={selection}
      state={state}
      handlers={handlers}
    />
  );
};