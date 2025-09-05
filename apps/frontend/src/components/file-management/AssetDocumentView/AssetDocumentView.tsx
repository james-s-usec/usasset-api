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
      const response = await apiService.get<{ assets: Asset[]; pagination: any }>(
        `/api/assets?projectId=${projectId}`
      );
      setState((prev) => ({ ...prev, assets: response.assets || [] }));
    } catch (error) {
      console.error('Failed to load assets:', error);
    }
  }, [setState]);

const useDocumentLoader = (setState: React.Dispatch<React.SetStateAction<DocumentsState>>) => 
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

const useNotesLoader = (setState: React.Dispatch<React.SetStateAction<DocumentsState>>) => 
  useCallback(async (projectId: string, assetId: string): Promise<void> => {
    try {
      const assetNotes = await documentService.getAssetNotes(projectId, assetId);
      setState((prev) => ({ ...prev, notes: assetNotes }));
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  }, [setState]);

export const AssetDocumentView: React.FC<AssetDocumentViewProps> = ({ 
  projects, 
  onFileDownload 
}) => {
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

  useEffect(() => {
    if (selection.selectedProject) {
      void loadAssets(selection.selectedProject);
    }
  }, [selection.selectedProject, loadAssets]);

  useEffect(() => {
    if (selection.selectedAsset && selection.selectedProject) {
      void loadDocs(selection.selectedProject, selection.selectedAsset);
      void loadNotes(selection.selectedProject, selection.selectedAsset);
    }
  }, [selection.selectedAsset, selection.selectedProject, loadDocs, loadNotes]);

  const handleProjectChange = useCallback((projectId: string): void => {
    setSelection((prev) => ({
      ...prev,
      selectedProject: projectId,
      selectedAsset: '',
    }));
    setState((prev) => ({ ...prev, documents: [], notes: {} }));
  }, []);

  const handleAssetChange = useCallback((assetId: string): void => {
    setSelection((prev) => ({ ...prev, selectedAsset: assetId }));
  }, []);

  const handleFileTypeChange = useCallback((fileType: FileType): void => {
    setSelection((prev) => ({ ...prev, selectedFileType: fileType }));
  }, []);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
      const file = event.target.files?.[0];
      if (!file || !selection.selectedProject || !selection.selectedAsset) return;

      setState((prev) => ({ ...prev, uploading: true }));
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
        setState((prev) => ({ ...prev, uploading: false }));
        event.target.value = '';
      }
    },
    [selection, loadDocs]
  );

  const handleDeleteDocument = useCallback(
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

  const handleNoteSave = useCallback(
    async (noteField: keyof AssetNotes, value: string): Promise<void> => {
      if (!selection.selectedProject || !selection.selectedAsset) return;

      try {
        const updatedNotes = await documentService.updateAssetNotes(
          selection.selectedProject,
          selection.selectedAsset,
          { [noteField]: value }
        );
        setState((prev) => ({ ...prev, notes: updatedNotes }));
      } catch (error) {
        console.error('Failed to save note:', error);
      }
    },
    [selection]
  );

  return (
    <Box>
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

      {selection.selectedAsset && (
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
      )}
    </Box>
  );
};