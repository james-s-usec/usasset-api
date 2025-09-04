import React from 'react';
import {
  Box,
  MenuItem,
  FormControlLabel,
  Switch,
  Typography,
  Divider,
} from '@mui/material';
import type { ColumnCategory } from './columnConfig';

interface ColumnMenuContentProps {
  categories: ColumnCategory[];
  onToggle: (categoryId: string) => void;
}

const CategoryItem: React.FC<{ category: ColumnCategory; onToggle: (id: string) => void }> = ({ category, onToggle }) => (
  <MenuItem
    key={category.id}
    onClick={() => onToggle(category.id)}
    dense
    sx={{ py: 1 }}
  >
    <FormControlLabel
      control={
        <Switch
          checked={category.enabled}
          onChange={() => onToggle(category.id)}
          size="small"
          color="primary"
        />
      }
      label={
        <Box>
          <Typography variant="body2">
            {category.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {category.columns.length} columns
          </Typography>
        </Box>
      }
      sx={{ m: 0, width: '100%' }}
    />
  </MenuItem>
);

export const ColumnMenuContent: React.FC<ColumnMenuContentProps> = ({
  categories,
  onToggle,
}) => (
  <>
    <Box sx={{ px: 2, py: 1 }}>
      <Typography variant="subtitle2" color="text.secondary">
        Column Categories
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Toggle column groups to customize your view
      </Typography>
    </Box>
    <Divider />
    
    {categories.map((category) => (
      <CategoryItem key={category.id} category={category} onToggle={onToggle} />
    ))}
    
    <Divider />
    <Box sx={{ px: 2, py: 1 }}>
      <Typography variant="caption" color="text.secondary">
        Core columns (Asset Tag, Name, Status, Actions) are always visible
      </Typography>
    </Box>
  </>
);