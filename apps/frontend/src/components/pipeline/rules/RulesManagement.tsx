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

const MainContent: React.FC<MainContentProps> = ({
  currentTab,
  selectedPhase,
  onPhaseChange,
  filteredRules,
  jobs,
  loading,
  loadRules,
  loadJobs,
  testRules,
  testOrchestrator,
  handleEditRule,
  deleteRule,
  setShowRuleEditor
}) => (
  <>
    {currentTab === 0 && (
      <RulesTab
        selectedPhase={selectedPhase}
        onPhaseChange={onPhaseChange}
        filteredRules={filteredRules}
        loading={loading}
        onRefresh={loadRules}
        onAddRule={() => setShowRuleEditor(true)}
        onTestRules={testRules}
        onTestOrchestrator={testOrchestrator}
        onEditRule={handleEditRule}
        onDeleteRule={deleteRule}
      />
    )}
    {currentTab === 1 && <JobsList jobs={jobs} loading={loading} onRefresh={loadJobs} />}
  </>
);

export const RulesManagement: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedPhase, setSelectedPhase] = useState<string>('');
  
  const { showRuleEditor, editingRule, handleEditRule, handleCloseEditor, setShowRuleEditor, setEditingRule } = useRuleEditor();
  const { rules, jobs, loading, error, testResult, loadRules, loadJobs, testRules, testOrchestrator, saveRule, deleteRule, clearError } = useRulesManagement();

  useEffect(() => {
    if (currentTab === 0) loadRules();
    else if (currentTab === 1) loadJobs();
  }, [currentTab, loadRules, loadJobs]);

  const handleSaveRule = async (ruleData: NewRuleData): Promise<boolean> => {
    const success = await saveRule(ruleData, editingRule);
    if (success) {
      setEditingRule(null);
      setShowRuleEditor(false);
    }
    return success;
  };

  const filteredRules = selectedPhase ? rules.filter(rule => rule.phase === selectedPhase) : rules;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TabHeader currentTab={currentTab} onTabChange={setCurrentTab} />
      {error && <Alert severity="error" sx={{ m: 2 }} onClose={clearError}>{error}</Alert>}
      {testResult && <TestResults testResult={testResult} />}
      
      <MainContent
        currentTab={currentTab}
        selectedPhase={selectedPhase}
        onPhaseChange={setSelectedPhase}
        filteredRules={filteredRules}
        jobs={jobs}
        loading={loading}
        loadRules={loadRules}
        loadJobs={loadJobs}
        testRules={testRules}
        testOrchestrator={testOrchestrator}
        handleEditRule={handleEditRule}
        deleteRule={deleteRule}
        setShowRuleEditor={setShowRuleEditor}
      />
      
      <RuleEditor 
        open={showRuleEditor} 
        editingRule={editingRule} 
        loading={loading} 
        onClose={handleCloseEditor} 
        onSave={handleSaveRule} 
      />
    </Box>
  );
};