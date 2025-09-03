import React from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  FormControlLabel,
  Switch,
  Typography,
  Divider,
  Chip,
} from '@mui/material';
import { ViewColumn as ViewColumnIcon } from '@mui/icons-material';
import type { ColumnCategory } from './columnConfig';

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

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleToggle = (categoryId: string) => {
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
          <MenuItem
            key={category.id}
            onClick={() => handleToggle(category.id)}
            dense
            sx={{ py: 1 }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={category.enabled}
                  onChange={() => handleToggle(category.id)}
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
        ))}
        
        <Divider />
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Core columns (Asset Tag, Name, Status, Actions) are always visible
          </Typography>
        </Box>
      </Menu>
    </Box>
  );
};