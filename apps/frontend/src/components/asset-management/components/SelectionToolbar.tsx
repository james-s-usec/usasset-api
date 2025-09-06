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

// Extracted component for selection count display
const SelectionCountChip: React.FC<{ count: number; hasSelection: boolean }> = ({ 
  count, 
  hasSelection 
}) => (
  <Chip
    label={`${count} selected`}
    color={hasSelection ? 'primary' : 'default'}
    variant={hasSelection ? 'filled' : 'outlined'}
    size="small"
  />
);

// Extracted component for selection control buttons
const SelectionControls: React.FC<{
  onSelectAll: () => void;
  onClearSelection: () => void;
  hasSelection: boolean;
}> = ({ onSelectAll, onClearSelection, hasSelection }) => (
  <>
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
  </>
);

// Extracted component for bulk action buttons
const BulkActions: React.FC<{
  selectedAssets: Asset[];
  selectedCount: number;
  onBulkEdit?: (assets: Asset[]) => void;
  onBulkDelete?: (assets: Asset[]) => void;
}> = ({ selectedAssets, selectedCount, onBulkEdit, onBulkDelete }) => (
  <>
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
);

// Helper function to get toolbar background color
const getToolbarBackgroundColor = (hasSelection: boolean): string => 
  hasSelection ? '#e3f2fd' : '#f5f5f5';

// Main component - now much simpler with reduced complexity
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
        backgroundColor: getToolbarBackgroundColor(hasSelection),
        borderRadius: 1,
        transition: 'background-color 0.2s ease',
        mb: 1,
      }}
    >
      <SelectionCountChip count={selectedCount} hasSelection={hasSelection} />
      <SelectionControls 
        onSelectAll={onSelectAll}
        onClearSelection={onClearSelection}
        hasSelection={hasSelection}
      />
      {hasSelection && (
        <>
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          <BulkActions
            selectedAssets={selectedAssets}
            selectedCount={selectedCount}
            onBulkEdit={onBulkEdit}
            onBulkDelete={onBulkDelete}
          />
          <Typography variant="caption" sx={{ ml: 'auto', color: 'text.secondary' }}>
            {selectedCount} of {selectedCount} asset{selectedCount !== 1 ? 's' : ''} selected
          </Typography>
        </>
      )}
    </Box>
  );
};