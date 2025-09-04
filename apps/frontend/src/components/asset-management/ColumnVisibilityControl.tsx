import React from 'react';
import {
  Box,
  Button,
  Menu,
  Chip,
} from '@mui/material';
import { ViewColumn as ViewColumnIcon } from '@mui/icons-material';
import type { ColumnCategory } from './columnConfig';
import { ColumnMenuContent } from './ColumnMenu';

interface ColumnVisibilityControlProps {
  categories: ColumnCategory[];
  onCategoryToggle: (categoryId: string) => void;
}

const ColumnButton: React.FC<{
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
  enabledCount: number;
  totalCount: number;
}> = ({ onClick, enabledCount, totalCount }) => (
  <Button
    variant="outlined"
    startIcon={<ViewColumnIcon />}
    onClick={onClick}
    endIcon={
      <Chip 
        size="small" 
        label={`${enabledCount}/${totalCount}`}
        color="primary"
        variant="outlined"
      />
    }
  >
    Columns
  </Button>
);

const ColumnMenu: React.FC<{
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  categories: ColumnCategory[];
  onToggle: (categoryId: string) => void;
}> = ({ anchorEl, open, onClose, categories, onToggle }) => (
  <Menu
    anchorEl={anchorEl}
    open={open}
    onClose={onClose}
    PaperProps={{
      style: {
        maxHeight: 400,
        width: '280px',
      },
    }}
  >
    <ColumnMenuContent categories={categories} onToggle={onToggle} />
  </Menu>
);

// Custom hook for menu state management
const useMenuState = (): {
  anchorEl: HTMLElement | null;
  open: boolean;
  handleClick: (event: React.MouseEvent<HTMLElement>) => void;
  handleClose: () => void;
} => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
  const handleClick = (event: React.MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = (): void => {
    setAnchorEl(null);
  };
  
  return { anchorEl, open, handleClick, handleClose };
};

// Simplified main component - now under 30 lines
export const ColumnVisibilityControl: React.FC<ColumnVisibilityControlProps> = ({
  categories,
  onCategoryToggle,
}) => {
  const { anchorEl, open, handleClick, handleClose } = useMenuState();
  const enabledCount = categories.filter(cat => cat.enabled).length;
  const totalCount = categories.length;

  return (
    <Box>
      <ColumnButton 
        onClick={handleClick}
        enabledCount={enabledCount}
        totalCount={totalCount}
      />
      <ColumnMenu 
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        categories={categories}
        onToggle={onCategoryToggle}
      />
    </Box>
  );
};