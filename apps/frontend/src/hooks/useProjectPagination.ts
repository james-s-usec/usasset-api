import { useState, useCallback, useEffect } from 'react';

interface PaginationState {
  page: number;
  pageSize: number;
  handlePageChange: (newPage: number) => void;
  handlePageSizeChange: (newPageSize: number) => void;
  resetToFirstPage: () => void;
}

interface PaginationOptions {
  defaultPageSize?: number;
  onPaginationChange?: (page: number, pageSize: number) => void;
}

/**
 * Hook to manage pagination state
 * Follows the complexity budget: single responsibility for pagination
 */
export function useProjectPagination(options: PaginationOptions = {}): PaginationState {
  const { defaultPageSize = 10, onPaginationChange } = options;
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Notify parent when pagination changes
  useEffect(() => {
    if (onPaginationChange) {
      onPaginationChange(page, pageSize);
    }
  }, [page, pageSize, onPaginationChange]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when page size changes
  }, []);

  const resetToFirstPage = useCallback(() => {
    setPage(1);
  }, []);

  return {
    page,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
    resetToFirstPage,
  };
}