import type { FileData } from './types';
import type { FileFilters } from './FileFilterBar';

// Mimetype to file type mappings - extracted as constant for maintainability
const MIMETYPE_MAPPINGS: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.ms-excel': 'XLS',
};

// Mimetype pattern checks - extracted for clarity
const MIMETYPE_PATTERNS: Array<{ check: (mime: string) => boolean; type: string }> = [
  { check: (mime) => mime.includes('wordprocessingml.document'), type: 'DOCX' },
  { check: (mime) => mime.includes('presentationml.presentation'), type: 'PPTX' },
  { check: (mime) => mime.includes('spreadsheetml.sheet'), type: 'XLSX' },
  { check: (mime) => mime.includes('csv'), type: 'CSV' },
  { check: (mime) => mime.startsWith('image/'), type: 'Image' },
  { check: (mime) => mime.startsWith('video/'), type: 'Video' },
  { check: (mime) => mime.startsWith('audio/'), type: 'Audio' },
  { check: (mime) => mime.includes('zip'), type: 'Archive' },
];

// File type mapping - now with reduced complexity
const getFileTypeFromMimetype = (mimetype: string): string => {
  // Check exact matches first
  const exactMatch = MIMETYPE_MAPPINGS[mimetype];
  if (exactMatch) return exactMatch;
  
  // Check patterns
  const patternMatch = MIMETYPE_PATTERNS.find(pattern => pattern.check(mimetype));
  if (patternMatch) return patternMatch.type;
  
  // Default fallback
  return 'Other';
};

// Date calculation helpers - extracted for clarity and testability
const getDateRangeBoundary = (range: string, now: Date): Date | null => {
  switch (range) {
    case 'today': {
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      return today;
    }
    case 'week': {
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    case 'month': {
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }
    case 'quarter': {
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    }
    default: {
      return null;
    }
  }
};

// Date range check - simplified with helper function
const isInDateRange = (fileDate: string, range: string): boolean => {
  if (range === 'all') return true;
  
  const now = new Date();
  const fileDateTime = new Date(fileDate);
  
  if (range === 'today') {
    return fileDateTime.toDateString() === now.toDateString();
  }
  
  const boundary = getDateRangeBoundary(range, now);
  return boundary ? fileDateTime >= boundary : true;
};

// Size range constants for better maintainability
const SIZE_RANGES = {
  MB: 1024 * 1024,
  SMALL_LIMIT: 1024 * 1024,         // 1 MB
  MEDIUM_MIN: 1024 * 1024,          // 1 MB
  MEDIUM_MAX: 10 * 1024 * 1024,     // 10 MB
  LARGE_MIN: 10 * 1024 * 1024       // 10 MB
};

// Size range check - cleaner with constants
const isInSizeRange = (fileSize: number, range: string): boolean => {
  switch (range) {
    case 'small': {
      return fileSize < SIZE_RANGES.SMALL_LIMIT;
    }
    case 'medium': {
      return fileSize >= SIZE_RANGES.MEDIUM_MIN && fileSize <= SIZE_RANGES.MEDIUM_MAX;
    }
    case 'large': {
      return fileSize > SIZE_RANGES.LARGE_MIN;
    }
    default: {
      return true;
    }
  }
};

// Search filter helpers - each with single responsibility
const matchesSearch = (searchTerm: string, ...values: (string | undefined)[]): boolean => {
  const searchLower = searchTerm.toLowerCase();
  return values.some(value => value?.toLowerCase().includes(searchLower));
};

const fileMatchesSearchTerm = (file: FileData, searchTerm: string): boolean => {
  if (!searchTerm) return true;
  
  return matchesSearch(
    searchTerm,
    file.original_name,
    file.mimetype,
    file.project?.name,
    file.folder?.name
  );
};

// Project filter - extracted for clarity
const fileMatchesProject = (file: FileData, projectId: string): boolean => {
  if (!projectId) return true;
  return file.project?.id === projectId;
};

// Folder filter - handles both organized and unorganized files
const fileMatchesFolder = (file: FileData, folderId: string): boolean => {
  if (!folderId) return true;
  
  if (folderId === 'unorganized') {
    return !file.folder;
  }
  
  return file.folder?.id === folderId;
};

// File type filter - uses the type mapper
const fileMatchesType = (file: FileData, fileType: string): boolean => {
  if (!fileType) return true;
  return getFileTypeFromMimetype(file.mimetype) === fileType;
};

// Date filter - delegates to date range checker
const fileMatchesDateRange = (file: FileData, dateRange: string): boolean => {
  if (!dateRange || dateRange === 'all') return true;
  return isInDateRange(file.created_at, dateRange);
};

// Size filter - delegates to size range checker
const fileMatchesSizeRange = (file: FileData, sizeRange: string): boolean => {
  if (!sizeRange || sizeRange === 'all') return true;
  return isInSizeRange(file.size, sizeRange);
};

// Main filter function - now much simpler and clearer
export const applyFilters = (files: FileData[], filters: FileFilters): FileData[] => {
  return files.filter(file => {
    // Each check is now a simple, testable function call
    if (!fileMatchesSearchTerm(file, filters.search)) return false;
    if (!fileMatchesProject(file, filters.projectId)) return false;
    if (!fileMatchesFolder(file, filters.folderId)) return false;
    if (!fileMatchesType(file, filters.fileType)) return false;
    if (!fileMatchesDateRange(file, filters.dateRange)) return false;
    if (!fileMatchesSizeRange(file, filters.sizeRange)) return false;
    
    return true;
  });
};

// Count active filters - extracted for single responsibility
const countActiveFilters = (filters: FileFilters): number => {
  return Object.entries(filters).filter(([key, value]) => {
    if (key === 'search') return value !== '';
    if (key === 'dateRange' || key === 'sizeRange') return value !== 'all';
    return Boolean(value);
  }).length;
};

// Filter summary generator - simplified logic
export const getFilterSummary = (
  totalFiles: number, 
  filteredFiles: number, 
  filters: FileFilters
): string => {
  if (totalFiles === filteredFiles) {
    return `Showing all ${totalFiles} files`;
  }
  
  const activeCount = countActiveFilters(filters);
  const filterText = activeCount === 1 ? 'filter' : 'filters';
  
  return `Showing ${filteredFiles} of ${totalFiles} files (${activeCount} ${filterText} applied)`;
};

// Default filter factory - clear intent
export const createDefaultFilters = (): FileFilters => ({
  search: '',
  projectId: '',
  folderId: '',
  fileType: '',
  dateRange: 'all',
  sizeRange: 'all',
});