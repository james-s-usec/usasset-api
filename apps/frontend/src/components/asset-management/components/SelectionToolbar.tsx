import React from 'react';
import { Box, Typography, Button, Chip, Divider } from '@mui/material';
import { SelectAll, Clear, Edit, Delete } from '@mui/icons-material';
import type { Asset } from '../types';

interface SelectionToolbarProps {
  selectedAssets: Asset[];
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkEdit?: (assets: Asset[]) => void;
  onBulkDelete?: (assets: Asset[]) => void;
}

export const SelectionToolbar: React.FC<SelectionToolbarProps> = ({
  selectedAssets,
  onSelectAll,
  onClearSelection,
  onBulkEdit,
  onBulkDelete,
}) => {
  const selectedCount = selectedAssets.length;
  const hasSelection = selectedCount > 0;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 1,
        backgroundColor: hasSelection ? '#e3f2fd' : '#f5f5f5',
        borderRadius: 1,
        transition: 'background-color 0.2s ease',
        mb: 1,
      }}
    >
      {/* Selection Count */}
      <Chip
        label={`${selectedCount} selected`}
        color={hasSelection ? 'primary' : 'default'}
        variant={hasSelection ? 'filled' : 'outlined'}
        size="small"
      />

      {/* Selection Controls */}
      <Button
        size="small"
        startIcon={<SelectAll />}
        onClick={onSelectAll}
        variant="outlined"
        sx={{ minWidth: 'auto' }}
      >
        All
      </Button>

      <Button
        size="small"
        startIcon={<Clear />}
        onClick={onClearSelection}
        variant="outlined"
        disabled={!hasSelection}
        sx={{ minWidth: 'auto' }}
      >
        Clear
      </Button>

      {hasSelection && (
        <>
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          
          {/* Bulk Actions */}
          {onBulkEdit && (
            <Button
              size="small"
              startIcon={<Edit />}
              onClick={() => onBulkEdit(selectedAssets)}
              variant="contained"
              color="primary"
              sx={{ minWidth: 'auto' }}
            >
              Edit {selectedCount > 1 ? `(${selectedCount})` : ''}
            </Button>
          )}

          {onBulkDelete && (
            <Button
              size="small"
              startIcon={<Delete />}
              onClick={() => onBulkDelete(selectedAssets)}
              variant="contained"
              color="error"
              sx={{ minWidth: 'auto' }}
            >
              Delete {selectedCount > 1 ? `(${selectedCount})` : ''}
            </Button>
          )}
        </>
      )}

      {/* Selection Summary */}
      {hasSelection && (
        <Typography variant="caption" sx={{ ml: 'auto', color: 'text.secondary' }}>
          {selectedCount} of {selectedCount} asset{selectedCount !== 1 ? 's' : ''} selected
        </Typography>
      )}
    </Box>
  );
};