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

const CategoryHeader: React.FC<{
  enabledCount: number;
  totalCategories: number;
}> = ({ enabledCount, totalCategories }) => (
  <>
    <Typography variant="h6" gutterBottom>
      Column Categories
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
      {enabledCount} of {totalCategories} categories enabled
    </Typography>
    <Divider sx={{ mb: 2 }} />
  </>
);

const CategoryItem: React.FC<{
  category: ColumnCategory;
  onToggle: (categoryId: string) => void;
}> = ({ category, onToggle }) => (
  <FormControlLabel
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
);

const CategoryList: React.FC<{
  categories: ColumnCategory[];
  enabledCount: number;
  totalCategories: number;
  onToggle: (categoryId: string) => void;
}> = ({ categories, enabledCount, totalCategories, onToggle }) => (
  <Box sx={{ p: 2, minWidth: 250 }}>
    <CategoryHeader enabledCount={enabledCount} totalCategories={totalCategories} />
    <FormGroup>
      {categories.map((category) => (
        <CategoryItem key={category.id} category={category} onToggle={onToggle} />
      ))}
    </FormGroup>
  </Box>
);

const usePopoverState = (): {
  anchorEl: HTMLElement | null;
  open: boolean;
  handleClick: (event: React.MouseEvent<HTMLElement>) => void;
  handleClose: () => void;
} => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (): void => {
    setAnchorEl(null);
  };

  return { anchorEl, open, handleClick, handleClose };
};

const useCategoryToggle = (
  categories: ColumnCategory[],
  onUpdateCategories: (categories: ColumnCategory[]) => void
): { handleToggleCategory: (categoryId: string) => void } => {
  const handleToggleCategory = (categoryId: string): void => {
    const updatedCategories = categories.map(category =>
      category.id === categoryId 
        ? { ...category, enabled: !category.enabled }
        : category
    );
    onUpdateCategories(updatedCategories);
  };

  return { handleToggleCategory };
};

const useColumnVisibilityControl = (
  categories: ColumnCategory[],
  onUpdateCategories: (categories: ColumnCategory[]) => void
): {
  anchorEl: HTMLElement | null;
  open: boolean;
  handleClick: (event: React.MouseEvent<HTMLElement>) => void;
  handleClose: () => void;
  handleToggleCategory: (categoryId: string) => void;
  enabledCount: number;
  totalCategories: number;
} => {
  const popover = usePopoverState();
  const toggle = useCategoryToggle(categories, onUpdateCategories);
  const enabledCount = categories.filter(cat => cat.enabled).length;
  const totalCategories = categories.length;

  return {
    ...popover,
    ...toggle,
    enabledCount,
    totalCategories,
  };
};

const ColumnToggleButton: React.FC<{
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
  enabledCount: number;
  totalCategories: number;
}> = ({ onClick, enabledCount, totalCategories }) => (
  <IconButton
    onClick={onClick}
    color="primary"
    title={`Column Categories (${enabledCount}/${totalCategories} enabled)`}
  >
    <ViewColumnIcon />
  </IconButton>
);

const CategoryPopover: React.FC<{
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  categories: ColumnCategory[];
  enabledCount: number;
  totalCategories: number;
  onToggle: (categoryId: string) => void;
}> = ({ open, anchorEl, onClose, categories, enabledCount, totalCategories, onToggle }) => (
  <Popover
    open={open}
    anchorEl={anchorEl}
    onClose={onClose}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
  >
    <CategoryList
      categories={categories}
      enabledCount={enabledCount}
      totalCategories={totalCategories}
      onToggle={onToggle}
    />
  </Popover>
);

export const ColumnVisibilityControl: React.FC<ColumnVisibilityControlProps> = ({
  categories,
  onUpdateCategories,
}) => {
  const controlState = useColumnVisibilityControl(categories, onUpdateCategories);

  return (
    <>
      <ColumnToggleButton 
        onClick={controlState.handleClick}
        enabledCount={controlState.enabledCount}
        totalCategories={controlState.totalCategories}
      />
      <CategoryPopover 
        {...controlState}
        categories={categories}
        onToggle={controlState.handleToggleCategory}
        onClose={controlState.handleClose}
      />
    </>
  );
};