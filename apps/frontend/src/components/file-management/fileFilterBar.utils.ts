// Utility functions for FileFilterBar
import type { FileData } from './types';
import type { FileFilters } from './FileFilterBar';

// File type extraction with reduced complexity
const MIMETYPE_MAP: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.ms-excel': 'XLS',
};

const MIMETYPE_PATTERNS = [
  { pattern: 'wordprocessingml.document', type: 'DOCX' },
  { pattern: 'presentationml.presentation', type: 'PPTX' },
  { pattern: 'spreadsheetml.sheet', type: 'XLSX' },
  { pattern: 'csv', type: 'CSV' },
  { pattern: 'zip', type: 'Archive' },
];

const MIMETYPE_PREFIXES = [
  { prefix: 'image/', type: 'Image' },
  { prefix: 'video/', type: 'Video' },
  { prefix: 'audio/', type: 'Audio' },
];

export const getFileTypeFromMimetype = (mimetype: string): string => {
  // Check exact matches
  if (MIMETYPE_MAP[mimetype]) return MIMETYPE_MAP[mimetype];
  
  // Check patterns
  for (const { pattern, type } of MIMETYPE_PATTERNS) {
    if (mimetype.includes(pattern)) return type;
  }
  
  // Check prefixes
  for (const { prefix, type } of MIMETYPE_PREFIXES) {
    if (mimetype.startsWith(prefix)) return type;
  }
  
  return 'Other';
};

export const getUniqueFileTypes = (files: FileData[]): Array<{ value: string; label: string; count: number }> => {
  const typeCounts = new Map<string, number>();
  
  files.forEach(file => {
    const type = getFileTypeFromMimetype(file.mimetype);
    typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
  });
  
  return Array.from(typeCounts.entries())
    .map(([type, count]) => ({ value: type, label: type, count }))
    .sort((a, b) => b.count - a.count);
};

export const getActiveFiltersCount = (filters: FileFilters): number => {
  let count = 0;
  if (filters.search) count++;
  if (filters.projectId) count++;
  if (filters.folderId) count++;
  if (filters.fileType) count++;
  if (filters.dateRange !== 'all') count++;
  if (filters.sizeRange !== 'all') count++;
  return count;
};