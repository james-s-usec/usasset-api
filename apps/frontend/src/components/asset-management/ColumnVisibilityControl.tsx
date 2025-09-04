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

export const ColumnVisibilityControl: React.FC<ColumnVisibilityControlProps> = ({
  categories,
  onCategoryToggle,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (): void => {
    setAnchorEl(null);
  };

  const handleToggle = (categoryId: string): void => {
    onCategoryToggle(categoryId);
  };

  const enabledCount = categories.filter(cat => cat.enabled).length;
  const totalCount = categories.length;

  return (
    <Box>
      <Button
        variant="outlined"
        startIcon={<ViewColumnIcon />}
        onClick={handleClick}
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
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: 400,
            width: '280px',
          },
        }}
      >
        <ColumnMenuContent categories={categories} onToggle={handleToggle} />
      </Menu>
    </Box>
  );
};