export const FileType = {
  DOCUMENT: 'DOCUMENT',
  MANUAL: 'MANUAL',
  SPECIFICATION: 'SPECIFICATION',
  PHOTO: 'PHOTO',
  DRAWING: 'DRAWING',
  CERTIFICATE: 'CERTIFICATE',
  MAINTENANCE: 'MAINTENANCE',
  OTHER: 'OTHER'
} as const;

export type FileType = typeof FileType[keyof typeof FileType];

export interface AssetDocument {
  id: string;
  filename: string;
  original_name: string;
  mimetype: string;
  size: number;
  file_type: FileType;
  asset_id: string;
  asset_name?: string;
  asset_tag?: string;
  created_at: string;
  updated_at: string;
}

export interface AssetNotes {
  note1Subject?: string | null;
  note1?: string | null;
  note2Subject?: string | null;
  note2?: string | null;
  note3Subject?: string | null;
  note3?: string | null;
  note4Subject?: string | null;
  note4?: string | null;
  note5Subject?: string | null;
  note5?: string | null;
  note6Subject?: string | null;
  note6?: string | null;
}

export interface AssetDocumentation {
  documents: AssetDocument[];
  documentCount: number;
  documentsByType: Record<string, number>;
}

export const FILE_TYPE_LABELS: Record<FileType, string> = {
  [FileType.DOCUMENT]: 'Document',
  [FileType.MANUAL]: 'Manual',
  [FileType.SPECIFICATION]: 'Specification',
  [FileType.PHOTO]: 'Photo',
  [FileType.DRAWING]: 'Drawing',
  [FileType.CERTIFICATE]: 'Certificate',
  [FileType.MAINTENANCE]: 'Maintenance',
  [FileType.OTHER]: 'Other'
};

export const FILE_TYPE_COLORS: Record<FileType, string> = {
  [FileType.DOCUMENT]: '#2196F3',
  [FileType.MANUAL]: '#4CAF50',
  [FileType.SPECIFICATION]: '#9C27B0',
  [FileType.PHOTO]: '#FF9800',
  [FileType.DRAWING]: '#00BCD4',
  [FileType.CERTIFICATE]: '#F44336',
  [FileType.MAINTENANCE]: '#795548',
  [FileType.OTHER]: '#607D8B'
};