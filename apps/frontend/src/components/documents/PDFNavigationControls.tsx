import React from 'react';
import {
  Box,
  IconButton,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import {
  NavigateBefore,
  NavigateNext,
  FirstPage,
  LastPage,
} from '@mui/icons-material';

interface PDFNavigationControlsProps {
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

const PageSelector: React.FC<{
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, pageCount, onPageChange }) => (
  <FormControl size="small" sx={{ minWidth: 80 }}>
    <Select
      value={currentPage}
      onChange={(e) => onPageChange(Number(e.target.value))}
      variant="outlined"
    >
      {Array.from({ length: pageCount }, (_, i) => (
        <MenuItem key={i + 1} value={i + 1}>
          {i + 1}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

export const PDFNavigationControls: React.FC<PDFNavigationControlsProps> = ({
  currentPage,
  pageCount,
  onPageChange
}) => {
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === pageCount;

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <IconButton onClick={() => onPageChange(1)} disabled={isFirstPage}>
        <FirstPage />
      </IconButton>
      <IconButton onClick={() => onPageChange(currentPage - 1)} disabled={isFirstPage}>
        <NavigateBefore />
      </IconButton>
      
      <PageSelector
        currentPage={currentPage}
        pageCount={pageCount}
        onPageChange={onPageChange}
      />
      
      <IconButton onClick={() => onPageChange(currentPage + 1)} disabled={isLastPage}>
        <NavigateNext />
      </IconButton>
      <IconButton onClick={() => onPageChange(pageCount)} disabled={isLastPage}>
        <LastPage />
      </IconButton>
    </Box>
  );
};