import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import type { Asset } from './types';
import { AssetTableRow } from './AssetTableRow';

interface AssetTableProps {
  assets: Asset[];
  loading: boolean;
  onEdit: (asset: Asset) => void;
  onDelete: (id: string) => void;
}

/* eslint-disable max-lines-per-function */
export const AssetTable: React.FC<AssetTableProps> = ({
  assets,
  loading,
  onEdit,
  onDelete
}) => (
  <TableContainer component={Paper}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Asset Tag</TableCell>
          <TableCell>Name</TableCell>
          <TableCell>Created</TableCell>
          <TableCell>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={4} align="center">Loading...</TableCell>
          </TableRow>
        ) : assets.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} align="center">No assets found</TableCell>
          </TableRow>
        ) : (
          assets.map((asset) => (
            <AssetTableRow
              key={asset.id}
              asset={asset}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </TableBody>
    </Table>
  </TableContainer>
);