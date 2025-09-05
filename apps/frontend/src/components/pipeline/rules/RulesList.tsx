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
  onToggleRule: (ruleId: string, isActive: boolean) => Promise<boolean>;
}

interface RuleRowProps {
  rule: PipelineRule;
  loading: boolean;
  onEditRule: (rule: PipelineRule) => void;
  onDeleteRule: (ruleId: string) => void;
  onToggleRule: (ruleId: string, isActive: boolean) => Promise<boolean>;
}

const RuleActiveCell: React.FC<{ 
  isActive: boolean;
  ruleId: string;
  loading: boolean;
  onToggleRule: (ruleId: string, isActive: boolean) => Promise<boolean>;
}> = ({ isActive, ruleId, loading, onToggleRule }) => (
  <TableCell>
    <Switch 
      checked={isActive} 
      size="small"
      disabled={loading}
      onChange={(e) => onToggleRule(ruleId, e.target.checked)}
    />
  </TableCell>
);

const RuleNameCell: React.FC<{ name: string; description?: string }> = ({ 
  name, 
  description 
}) => (
  <TableCell>
    <Typography variant="body2" fontWeight="medium">
      {name}
    </Typography>
    {description && (
      <Typography variant="caption" color="text.secondary">
        {description}
      </Typography>
    )}
  </TableCell>
);

const RulePhaseCell: React.FC<{ phase: string }> = ({ phase }) => (
  <TableCell>
    <Chip 
      label={phase} 
      size="small" 
      variant="outlined" 
    />
  </TableCell>
);

const RuleTypeCell: React.FC<{ type: string }> = ({ type }) => (
  <TableCell>
    <Chip label={type} size="small" />
  </TableCell>
);

const RuleTargetCell: React.FC<{ target: string }> = ({ target }) => (
  <TableCell>
    <Typography variant="body2" fontFamily="monospace">
      {target}
    </Typography>
  </TableCell>
);

const RuleActionsCell: React.FC<{
  rule: PipelineRule;
  loading: boolean;
  onEditRule: (rule: PipelineRule) => void;
  onDeleteRule: (ruleId: string) => void;
}> = ({ rule, loading, onEditRule, onDeleteRule }) => (
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
);

const RuleRow: React.FC<RuleRowProps> = ({ 
  rule, 
  loading, 
  onEditRule, 
  onDeleteRule,
  onToggleRule
}) => (
  <TableRow key={rule.id} hover>
    <RuleActiveCell 
      isActive={rule.is_active}
      ruleId={rule.id}
      loading={loading}
      onToggleRule={onToggleRule}
    />
    <RuleNameCell name={rule.name} description={rule.description} />
    <RulePhaseCell phase={rule.phase} />
    <RuleTypeCell type={rule.type} />
    <RuleTargetCell target={rule.target} />
    <TableCell>{rule.priority}</TableCell>
    <RuleActionsCell 
      rule={rule}
      loading={loading}
      onEditRule={onEditRule}
      onDeleteRule={onDeleteRule}
    />
  </TableRow>
);

const EmptyState: React.FC = () => (
  <TableRow>
    <TableCell colSpan={7} align="center">
      <Typography color="text.secondary">
        No rules found. Click &quot;Test Rules&quot; to auto-create demo rules.
      </Typography>
    </TableCell>
  </TableRow>
);

const RulesTableHeader: React.FC = () => (
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
);

const RulesTable: React.FC<RulesListProps> = ({ 
  rules, 
  loading, 
  onEditRule, 
  onDeleteRule,
  onToggleRule
}) => (
  <TableContainer component={Paper}>
    <Table size="small" stickyHeader>
      <RulesTableHeader />
      <TableBody>
        {rules.length === 0 ? (
          <EmptyState />
        ) : (
          rules.map((rule) => (
            <RuleRow
              key={rule.id}
              rule={rule}
              loading={loading}
              onEditRule={onEditRule}
              onDeleteRule={onDeleteRule}
              onToggleRule={onToggleRule}
            />
          ))
        )}
      </TableBody>
    </Table>
  </TableContainer>
);

export const RulesList: React.FC<RulesListProps> = ({
  rules,
  loading,
  onEditRule,
  onDeleteRule,
  onToggleRule
}) => (
  <Box sx={{ flex: 1, overflow: 'auto', m: 2 }}>
    <RulesTable 
      rules={rules}
      loading={loading}
      onEditRule={onEditRule}
      onDeleteRule={onDeleteRule}
      onToggleRule={onToggleRule}
    />
  </Box>
);