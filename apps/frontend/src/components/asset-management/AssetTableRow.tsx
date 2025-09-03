import React from 'react';
import { TableRow, TableCell, Button } from '@mui/material';
import type { Asset } from './types';

interface AssetTableRowProps {
  asset: Asset;
  onEdit: (asset: Asset) => void;
  onDelete: (id: string) => void;
}

export const AssetTableRow: React.FC<AssetTableRowProps> = ({ 
  asset, 
  onEdit, 
  onDelete 
}) => (
  <TableRow>
    <TableCell>{asset.assetTag}</TableCell>
    <TableCell>{asset.name}</TableCell>
    <TableCell>{new Date(asset.created_at).toLocaleDateString()}</TableCell>
    <TableCell>
      <Button 
        size="small" 
        variant="outlined"
        sx={{ mr: 1 }}
        onClick={() => onEdit(asset)}
      >
        Edit
      </Button>
      <Button 
        size="small" 
        variant="outlined" 
        color="error"
        onClick={() => onDelete(asset.id)}
      >
        Delete
      </Button>
    </TableCell>
  </TableRow>
);