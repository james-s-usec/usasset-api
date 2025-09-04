// Helper functions for FileTableRow - extracted for simplicity and testability

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

export const getMimeTypeColor = (mimetype: string): 'primary' | 'secondary' | 'success' | 'warning' => {
  if (mimetype.includes('csv')) return 'success';
  if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return 'primary';
  if (mimetype.includes('image')) return 'secondary';
  if (mimetype === 'application/pdf') return 'primary';
  return 'warning';
};

// Type label mappings
const DOCUMENT_TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.ms-powerpoint': 'PPT',
};

const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/gif': 'GIF',
  'image/webp': 'WEBP',
};

// Pattern definitions
const OFFICE_PATTERNS: Array<[string, string]> = [
  ['wordprocessingml.document', 'DOCX'],
  ['presentationml.presentation', 'PPTX'],
  ['spreadsheetml.sheet', 'XLSX'],
];

const DATA_PATTERNS: Array<[string, string]> = [
  ['csv', 'CSV'],
  ['json', 'JSON'],
  ['xml', 'XML'],
  ['text/plain', 'TXT'],
  ['text/html', 'HTML'],
];

const ARCHIVE_PATTERNS: Array<[string, string]> = [
  ['zip', 'ZIP'],
  ['rar', 'RAR'],
  ['7z', '7Z'],
];

// Helper to check mime type patterns
const checkMimePattern = (mimetype: string, patterns: Array<[string, string]>): string | null => {
  for (const [pattern, label] of patterns) {
    if (mimetype.includes(pattern)) return label;
  }
  return null;
};

// Check specific type categories
const checkOfficeTypes = (mimetype: string): string | null => 
  checkMimePattern(mimetype, OFFICE_PATTERNS);

const checkDataTypes = (mimetype: string): string | null => 
  checkMimePattern(mimetype, DATA_PATTERNS);

const checkArchiveTypes = (mimetype: string): string | null => 
  checkMimePattern(mimetype, ARCHIVE_PATTERNS);

const checkImageType = (mimetype: string): string | null => {
  if (IMAGE_EXTENSIONS[mimetype]) return IMAGE_EXTENSIONS[mimetype];
  if (mimetype.startsWith('image/')) return 'Image';
  return null;
};

const checkMediaType = (mimetype: string): string | null => {
  if (mimetype.startsWith('video/')) return 'Video';
  if (mimetype.startsWith('audio/')) return 'Audio';
  return null;
};

export const getFileTypeLabel = (mimetype: string): string => {
  // Check exact document matches
  if (DOCUMENT_TYPES[mimetype]) return DOCUMENT_TYPES[mimetype];
  
  // Check each type category
  const officeMatch = checkOfficeTypes(mimetype);
  if (officeMatch) return officeMatch;
  
  const dataMatch = checkDataTypes(mimetype);
  if (dataMatch) return dataMatch;
  
  const imageMatch = checkImageType(mimetype);
  if (imageMatch) return imageMatch;
  
  const mediaMatch = checkMediaType(mimetype);
  if (mediaMatch) return mediaMatch;
  
  const archiveMatch = checkArchiveTypes(mimetype);
  if (archiveMatch) return archiveMatch;
  
  // Fallback
  return 'File';
};