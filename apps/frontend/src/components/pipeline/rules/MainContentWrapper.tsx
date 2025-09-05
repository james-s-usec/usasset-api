import React from 'react';
import { Box } from '@mui/material';
import { RulesTabWrapper } from './RulesTabWrapper';
import { JobsList } from './JobsList';
import { FieldMappingsTable } from './FieldMappingsTable';
import type { PipelineRule, PipelineJob } from './types';

interface MainContentWrapperProps {
  currentTab: number;
  selectedPhase: string;
  onPhaseChange: (phase: string) => void;
  filteredRules: PipelineRule[];
  jobs: PipelineJob[];
  loading: boolean;
  loadRules: () => Promise<void>;
  loadJobs: () => Promise<void>;
  testRules: () => Promise<void>;
  testOrchestrator: () => Promise<void>;
  handleEditRule: (rule: PipelineRule) => void;
  deleteRule: (id: string) => Promise<boolean>;
  toggleRule: (ruleId: string, isActive: boolean) => Promise<boolean>;
  setShowRuleEditor: (show: boolean) => void;
}

const RulesTabContent: React.FC<MainContentWrapperProps> = (props) => (
  <RulesTabWrapper
    selectedPhase={props.selectedPhase}
    onPhaseChange={props.onPhaseChange}
    filteredRules={props.filteredRules}
    loading={props.loading}
    onRefresh={props.loadRules}
    onAddRule={(): void => props.setShowRuleEditor(true)}
    onTestRules={props.testRules}
    onTestOrchestrator={props.testOrchestrator}
    onEditRule={props.handleEditRule}
    onDeleteRule={props.deleteRule}
    onToggleRule={props.toggleRule}
  />
);

const JobsTabContent: React.FC<MainContentWrapperProps> = (props) => (
  <JobsList 
    jobs={props.jobs} 
    loading={props.loading} 
    onRefresh={props.loadJobs} 
  />
);

const MappingsTabContent: React.FC = () => (
  <Box sx={{ flex: 1, overflow: 'auto' }}>
    <FieldMappingsTable selectedFile={null} />
  </Box>
);

export const MainContentWrapper: React.FC<MainContentWrapperProps> = (props) => {
  if (props.currentTab === 0) return <RulesTabContent {...props} />;
  if (props.currentTab === 1) return <JobsTabContent {...props} />;
  return <MappingsTabContent />;
};