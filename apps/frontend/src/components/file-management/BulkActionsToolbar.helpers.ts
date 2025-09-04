// Helper functions for BulkActionsToolbar
import type { FileData } from './types';

export const getSelectedFileNames = (
  allFiles: FileData[],
  selectedFiles: Set<string>
): string[] => {
  return allFiles
    .filter(file => selectedFiles.has(file.id))
    .map(file => file.original_name)
    .slice(0, 3);
};

export const calculateSelectionState = (
  selectedCount: number,
  totalCount: number
): { allSelected: boolean; someSelected: boolean } => {
  return {
    allSelected: selectedCount === totalCount && totalCount > 0,
    someSelected: selectedCount > 0 && selectedCount < totalCount,
  };
};