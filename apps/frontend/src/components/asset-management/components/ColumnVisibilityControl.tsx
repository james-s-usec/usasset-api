import React, { useState } from 'react';
import { 
  IconButton, 
  Popover, 
  FormGroup, 
  FormControlLabel, 
  Switch, 
  Typography, 
  Box,
  Divider
} from '@mui/material';
import { ViewColumn as ViewColumnIcon } from '@mui/icons-material';
import type { ColumnCategory } from '../columnConfig';

interface ColumnVisibilityControlProps {
  categories: ColumnCategory[];
  onUpdateCategories: (categories: ColumnCategory[]) => void;
}

// Popover content component to reduce main component size
const CategoryList: React.FC<{
  categories: ColumnCategory[];
  enabledCount: number;
  totalCategories: number;
  onToggle: (categoryId: string) => void;
}> = ({ categories, enabledCount, totalCategories, onToggle }) => (
  <Box sx={{ p: 2, minWidth: 250 }}>
    <Typography variant="h6" gutterBottom>
      Column Categories
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
      {enabledCount} of {totalCategories} categories enabled
    </Typography>
    <Divider sx={{ mb: 2 }} />
    <FormGroup>
      {categories.map((category) => (
        <FormControlLabel
          key={category.id}
          control={
            <Switch
              checked={category.enabled}
              onChange={() => onToggle(category.id)}
              size="small"
            />
          }
          label={
            <Box>
              <Typography variant="body2">{category.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {category.columns.length} fields
              </Typography>
            </Box>
          }
        />
      ))}
    </FormGroup>
  </Box>
);

export const ColumnVisibilityControl: React.FC<ColumnVisibilityControlProps> = ({
  categories,
  onUpdateCategories,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  
  const enabledCount = categories.filter(cat => cat.enabled).length;
  const totalCategories = categories.length;

  const handleClick = (event: React.MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (): void => {
    setAnchorEl(null);
  };

  const handleToggleCategory = (categoryId: string): void => {
    const updatedCategories = categories.map(category =>
      category.id === categoryId 
        ? { ...category, enabled: !category.enabled }
        : category
    );
    onUpdateCategories(updatedCategories);
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        color="primary"
        title={`Column Categories (${enabledCount}/${totalCategories} enabled)`}
      >
        <ViewColumnIcon />
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <CategoryList
          categories={categories}
          enabledCount={enabledCount}
          totalCategories={totalCategories}
          onToggle={handleToggleCategory}
        />
      </Popover>
    </>
  );
};