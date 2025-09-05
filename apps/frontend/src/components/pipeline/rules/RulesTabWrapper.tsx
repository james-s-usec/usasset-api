import React from 'react';
import { Box } from '@mui/material';
import { RuleFilters } from './RuleFilters';
import { RulesList } from './RulesList';
import type { PipelineRule } from './types';

interface RulesTabWrapperProps {
  selectedPhase: string;
  onPhaseChange: (phase: string) => void;
  filteredRules: PipelineRule[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  onAddRule: () => void;
  onTestRules: () => Promise<void>;
  onTestOrchestrator: () => Promise<void>;
  onEditRule: (rule: PipelineRule) => void;
  onDeleteRule: (id: string) => Promise<boolean>;
  onToggleRule: (ruleId: string, isActive: boolean) => Promise<boolean>;
}

export const RulesTabWrapper: React.FC<RulesTabWrapperProps> = (props) => (
  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
    <RuleFilters
      selectedPhase={props.selectedPhase}
      onPhaseChange={props.onPhaseChange}
      onRefresh={props.onRefresh}
      onAddRule={props.onAddRule}
      onTestRules={props.onTestRules}
      onTestOrchestrator={props.onTestOrchestrator}
      loading={props.loading}
    />
    <RulesList
      rules={props.filteredRules}
      loading={props.loading}
      onEditRule={props.onEditRule}
      onDeleteRule={props.onDeleteRule}
      onToggleRule={props.onToggleRule}
    />
  </Box>
);