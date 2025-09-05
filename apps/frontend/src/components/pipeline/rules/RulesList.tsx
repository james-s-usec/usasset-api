import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  Chip,
  IconButton
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import type { PipelineRule } from './types';

interface RulesListProps {
  rules: PipelineRule[];
  loading: boolean;
  onEditRule: (rule: PipelineRule) => void;
  onDeleteRule: (ruleId: string) => void;
}

export const RulesList: React.FC<RulesListProps> = ({
  rules,
  loading,
  onEditRule,
  onDeleteRule
}) => {
  return (
    <Box sx={{ flex: 1, overflow: 'auto', m: 2 }}>
      <TableContainer component={Paper}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Active</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Phase</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Target</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary">
                    No rules found. Click &quot;Test Rules&quot; to auto-create demo rules.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rules.map((rule) => (
                <TableRow key={rule.id} hover>
                  <TableCell>
                    <Switch
                      checked={rule.is_active}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {rule.name}
                    </Typography>
                    {rule.description && (
                      <Typography variant="caption" color="text.secondary">
                        {rule.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={rule.phase} 
                      size="small" 
                      variant="outlined" 
                    />
                  </TableCell>
                  <TableCell>
                    <Chip label={rule.type} size="small" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {rule.target}
                    </Typography>
                  </TableCell>
                  <TableCell>{rule.priority}</TableCell>
                  <TableCell>
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => onEditRule(rule)}
                      disabled={loading}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => onDeleteRule(rule.id)}
                      disabled={loading}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};