import React from 'react';
import { Box } from '@mui/material';

interface ResizableDividerProps {
  rulesWidth: number;
  onWidthChange: (width: number) => void;
}

// Hook for resize handling logic
const useResizeHandler = (rulesWidth: number, onWidthChange: (width: number) => void): {
  handleMouseDown: (e: React.MouseEvent) => void;
} => {
  const handleMouseDown = (e: React.MouseEvent): void => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rulesWidth;

    const handleMouseMove = (e: MouseEvent): void => {
      const deltaX = startX - e.clientX;
      const containerWidth = window.innerWidth;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newWidth = Math.min(Math.max(startWidth + deltaPercent, 25), 75);
      onWidthChange(newWidth);
    };

    const handleMouseUp = (): void => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return { handleMouseDown };
};

// Divider grip visual component
const DividerGrip: React.FC = () => (
  <Box sx={{
    width: 2,
    height: 40,
    backgroundColor: 'background.paper',
    borderRadius: 1
  }} />
);

// Main component - under 30 lines
export const ResizableDivider: React.FC<ResizableDividerProps> = ({
  rulesWidth,
  onWidthChange
}) => {
  const { handleMouseDown } = useResizeHandler(rulesWidth, onWidthChange);

  return (
    <Box
      onMouseDown={handleMouseDown}
      sx={{
        width: 8,
        cursor: 'col-resize',
        backgroundColor: 'divider',
        '&:hover': {
          backgroundColor: 'primary.main',
          opacity: 0.7
        },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}
    >
      <DividerGrip />
    </Box>
  );
};