import type { FileData } from './types';
import type { FileFilters } from './FileFilterBar';

const getFileTypeFromMimetype = (mimetype: string): string => {
  if (mimetype === 'application/pdf') return 'PDF';
  if (mimetype.includes('wordprocessingml.document')) return 'DOCX';
  if (mimetype.includes('presentationml.presentation')) return 'PPTX';
  if (mimetype.includes('spreadsheetml.sheet')) return 'XLSX';
  if (mimetype === 'application/msword') return 'DOC';
  if (mimetype === 'application/vnd.ms-excel') return 'XLS';
  if (mimetype.includes('csv')) return 'CSV';
  if (mimetype.startsWith('image/')) return 'Image';
  if (mimetype.startsWith('video/')) return 'Video';
  if (mimetype.startsWith('audio/')) return 'Audio';
  if (mimetype.includes('zip')) return 'Archive';
  return 'Other';
};

const isInDateRange = (fileDate: string, range: string): boolean => {
  const now = new Date();
  const fileDateTime = new Date(fileDate);
  
  switch (range) {
    case 'today':
      return fileDateTime.toDateString() === now.toDateString();
    case 'week':
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return fileDateTime >= weekAgo;
    case 'month':
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      return fileDateTime >= monthAgo;
    case 'quarter':
      const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      return fileDateTime >= quarterAgo;
    case 'all':
    default:
      return true;
  }
};

const isInSizeRange = (fileSize: number, range: string): boolean => {
  const MB = 1024 * 1024;
  
  switch (range) {
    case 'small':
      return fileSize < MB;
    case 'medium':
      return fileSize >= MB && fileSize <= 10 * MB;
    case 'large':
      return fileSize > 10 * MB;
    case 'all':
    default:
      return true;
  }
};

export const applyFilters = (files: FileData[], filters: FileFilters): FileData[] => {
  return files.filter(file => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesName = file.original_name.toLowerCase().includes(searchLower);
      const matchesType = file.mimetype.toLowerCase().includes(searchLower);
      const matchesProject = file.project?.name.toLowerCase().includes(searchLower);
      const matchesFolder = file.folder?.name.toLowerCase().includes(searchLower);
      
      if (!matchesName && !matchesType && !matchesProject && !matchesFolder) {
        return false;
      }
    }
    
    // Project filter
    if (filters.projectId) {
      if (!file.project || file.project.id !== filters.projectId) {
        return false;
      }
    }
    
    // Folder filter
    if (filters.folderId) {
      if (filters.folderId === 'unorganized') {
        if (file.folder) return false;
      } else {
        if (!file.folder || file.folder.id !== filters.folderId) {
          return false;
        }
      }
    }
    
    // File type filter
    if (filters.fileType) {
      const fileType = getFileTypeFromMimetype(file.mimetype);
      if (fileType !== filters.fileType) {
        return false;
      }
    }
    
    // Date range filter
    if (filters.dateRange && filters.dateRange !== 'all') {
      if (!isInDateRange(file.created_at, filters.dateRange)) {
        return false;
      }
    }
    
    // Size range filter
    if (filters.sizeRange && filters.sizeRange !== 'all') {
      if (!isInSizeRange(file.size, filters.sizeRange)) {
        return false;
      }
    }
    
    return true;
  });
};

export const getFilterSummary = (
  totalFiles: number, 
  filteredFiles: number, 
  filters: FileFilters
): string => {
  if (totalFiles === filteredFiles) {
    return `Showing all ${totalFiles} files`;
  }
  
  const activeFiltersCount = Object.values(filters).filter(value => 
    value && value !== 'all'
  ).length;
  
  return `Showing ${filteredFiles} of ${totalFiles} files (${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''} applied)`;
};

export const createDefaultFilters = (): FileFilters => ({
  search: '',
  projectId: '',
  folderId: '',
  fileType: '',
  dateRange: 'all',
  sizeRange: 'all',
});