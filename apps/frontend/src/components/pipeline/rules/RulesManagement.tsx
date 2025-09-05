import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import { useRulesManagement } from './useRulesManagement';
import { RuleFilters } from './RuleFilters';
import { TestResults } from './TestResults';
import { RulesList } from './RulesList';
import { JobsList } from './JobsList';
import { RuleEditor } from './RuleEditor';
import type { PipelineRule, NewRuleData, ImportJob } from './types';

interface TabHeaderProps {
  currentTab: number;
  onTabChange: (tab: number) => void;
}

const TabHeader: React.FC<TabHeaderProps> = ({ currentTab, onTabChange }) => (
  <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
    <Typography variant="h6" sx={{ p: 2, pb: 1 }}>
      ETL Management
    </Typography>
    
    <Tabs 
      value={currentTab} 
      onChange={(_, newValue) => onTabChange(newValue)}
      sx={{ px: 2 }}
    >
      <Tab label="Rules" />
      <Tab label="Jobs" />
    </Tabs>
  </Box>
);

interface RulesTabProps {
  selectedPhase: string;
  onPhaseChange: (phase: string) => void;
  filteredRules: PipelineRule[];
  loading: boolean;
  onRefresh: () => void;
  onAddRule: () => void;
  onTestRules: () => void;
  onTestOrchestrator: () => void;
  onEditRule: (rule: PipelineRule) => void;
  onDeleteRule: (id: string) => Promise<boolean>;
}

const RulesTab: React.FC<RulesTabProps> = ({
  selectedPhase,
  onPhaseChange,
  filteredRules,
  loading,
  onRefresh,
  onAddRule,
  onTestRules,
  onTestOrchestrator,
  onEditRule,
  onDeleteRule
}) => (
  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
    <RuleFilters
      selectedPhase={selectedPhase}
      onPhaseChange={onPhaseChange}
      onRefresh={onRefresh}
      onAddRule={onAddRule}
      onTestRules={onTestRules}
      onTestOrchestrator={onTestOrchestrator}
      loading={loading}
    />

    <RulesList
      rules={filteredRules}
      loading={loading}
      onEditRule={onEditRule}
      onDeleteRule={onDeleteRule}
    />
  </Box>
);

const useRuleEditor = (): {
  showRuleEditor: boolean;
  editingRule: PipelineRule | null;
  handleEditRule: (rule: PipelineRule) => void;
  handleCloseEditor: () => void;
  setShowRuleEditor: (show: boolean) => void;
  setEditingRule: (rule: PipelineRule | null) => void;
} => {
  const [showRuleEditor, setShowRuleEditor] = useState(false);
  const [editingRule, setEditingRule] = useState<PipelineRule | null>(null);

  const handleEditRule = (rule: PipelineRule): void => {
    setEditingRule(rule);
    setShowRuleEditor(true);
  };

  const handleCloseEditor = (): void => {
    setEditingRule(null);
    setShowRuleEditor(false);
  };

  return {
    showRuleEditor,
    editingRule,
    handleEditRule,
    handleCloseEditor,
    setShowRuleEditor,
    setEditingRule
  };
};

interface MainContentProps {
  currentTab: number;
  selectedPhase: string;
  onPhaseChange: (phase: string) => void;
  filteredRules: PipelineRule[];
  jobs: ImportJob[];
  loading: boolean;
  loadRules: () => void;
  loadJobs: () => void;
  testRules: () => void;
  testOrchestrator: () => void;
  handleEditRule: (rule: PipelineRule) => void;
  deleteRule: (id: string) => Promise<boolean>;
  setShowRuleEditor: (show: boolean) => void;
}

const MainContent: React.FC<MainContentProps> = (props) => (
  <>
    {props.currentTab === 0 && (
      <RulesTab
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
      />
    )}
    {props.currentTab === 1 && (
      <JobsList 
        jobs={props.jobs} 
        loading={props.loading} 
        onRefresh={props.loadJobs} 
      />
    )}
  </>
);

const useTabState = (): {
  currentTab: number;
  setCurrentTab: (tab: number) => void;
  selectedPhase: string;
  setSelectedPhase: (phase: string) => void;
} => {
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedPhase, setSelectedPhase] = useState<string>('');
  
  return { currentTab, setCurrentTab, selectedPhase, setSelectedPhase };
};

export const RulesManagement: React.FC = () => {
  const { currentTab, setCurrentTab, selectedPhase, setSelectedPhase } = useTabState();
  const editorState = useRuleEditor();
  const management = useRulesManagement();

  const filteredRules = selectedPhase ? management.rules.filter(rule => rule.phase === selectedPhase) : management.rules;

  useEffect(() => {
    if (currentTab === 0) management.loadRules();
    else if (currentTab === 1) management.loadJobs();
  }, [currentTab, management.loadRules, management.loadJobs]);

  const handleSaveRule = async (ruleData: NewRuleData): Promise<boolean> => {
    const success = await management.saveRule(ruleData, editorState.editingRule);
    if (success) {
      editorState.setEditingRule(null);
      editorState.setShowRuleEditor(false);
    }
    return success;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TabHeader currentTab={currentTab} onTabChange={setCurrentTab} />
      {management.error && (
        <Alert severity="error" sx={{ m: 2 }} onClose={management.clearError}>
          {management.error}
        </Alert>
      )}
      {management.testResult && <TestResults testResult={management.testResult} />}
      
      <MainContent
        currentTab={currentTab}
        selectedPhase={selectedPhase}
        onPhaseChange={setSelectedPhase}
        filteredRules={filteredRules}
        jobs={management.jobs}
        loading={management.loading}
        loadRules={management.loadRules}
        loadJobs={management.loadJobs}
        testRules={management.testRules}
        testOrchestrator={management.testOrchestrator}
        handleEditRule={editorState.handleEditRule}
        deleteRule={management.deleteRule}
        setShowRuleEditor={editorState.setShowRuleEditor}
      />
      
      <RuleEditor 
        open={editorState.showRuleEditor} 
        editingRule={editorState.editingRule} 
        loading={management.loading} 
        onClose={editorState.handleCloseEditor} 
        onSave={handleSaveRule} 
      />
    </Box>
  );
};