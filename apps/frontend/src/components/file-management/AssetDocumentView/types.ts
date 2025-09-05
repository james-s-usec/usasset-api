import type { AssetDocument, AssetNotes, FileType } from '../../../types/document.types';

export interface Asset {
  id: string;
  assetTag: string;
  name: string;
  projectId?: string;
}

export interface AssetDocumentViewProps {
  projects?: Array<{ id: string; name: string }>;
  onFileDownload?: (fileId: string) => Promise<void>;
  preSelectedAssetId?: string;
}

export interface SelectionState {
  selectedProject: string;
  selectedAsset: string;
  selectedFileType: FileType;
}

export interface DocumentsState {
  documents: AssetDocument[];
  notes: AssetNotes;
  assets: Asset[];
  loading: boolean;
  uploading: boolean;
}