import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import { useRulesManagement } from './useRulesManagement';
import { TestResults } from './TestResults';
import { RulesTabWrapper } from './RulesTabWrapper';
import { JobsList } from './JobsList';
import { RuleEditor } from './RuleEditor';
import { FieldMappingsTable } from '../components/FieldMappingsTable';
import type { PipelineRule, NewRuleData, ImportJob, RulesTestResult } from './types';

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
      <Tab label="Field Mappings" />
    </Tabs>
  </Box>
);

// RulesTabProps interface and RulesTab component have been moved to RulesTabWrapper

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
  toggleRule: (ruleId: string, isActive: boolean) => Promise<boolean>;
  setShowRuleEditor: (show: boolean) => void;
  selectedFile?: string | null;
}

const renderRulesTab = (props: MainContentProps): React.ReactElement => (
  <RulesTabWrapper
    selectedPhase={props.selectedPhase}
    onPhaseChange={props.onPhaseChange}
    filteredRules={props.filteredRules}
    loading={props.loading}
    onRefresh={async () => { await props.loadRules(); }}
    onAddRule={(): void => props.setShowRuleEditor(true)}
    onTestRules={async () => { await props.testRules(); }}
    onTestOrchestrator={async () => { await props.testOrchestrator(); }}
    onEditRule={props.handleEditRule}
    onDeleteRule={props.deleteRule}
    onToggleRule={props.toggleRule}
  />
);

const renderJobsTab = (props: MainContentProps): React.ReactElement => {
  const handleDownloadPhaseResults = async (jobId: string): Promise<void> => {
    try {
      const response = await fetch(`http://localhost:3000/api/pipeline/jobs/${jobId}/phase-results/download`);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `etl-phase-results-${jobId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download phase results:', error);
      alert('Failed to download phase results. Please try again.');
    }
  };

  return (
    <JobsList 
      jobs={props.jobs} 
      loading={props.loading} 
      onRefresh={props.loadJobs}
      onDownloadPhaseResults={handleDownloadPhaseResults}
    />
  );
};

const renderMappingsTab = (): React.ReactElement => (
  <Box sx={{ flex: 1, overflow: 'auto' }}>
    <FieldMappingsTable selectedFile={null} />
  </Box>
);

const TabContent: React.FC<{ currentTab: number; props: MainContentProps }> = ({ currentTab, props }) => {
  if (currentTab === 0) return renderRulesTab(props);
  if (currentTab === 1) return renderJobsTab(props);
  return renderMappingsTab();
};

const MainContent: React.FC<MainContentProps> = (props) => (
  <TabContent currentTab={props.currentTab} props={props} />
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

// Hook to handle save logic
const useSaveHandler = (
  management: ReturnType<typeof useRulesManagement>,
  editorState: ReturnType<typeof useRuleEditor>
): ((ruleData: NewRuleData) => Promise<boolean>) => {
  const handleSaveRule = async (ruleData: NewRuleData): Promise<boolean> => {
    const success = await management.saveRule(ruleData, editorState.editingRule);
    if (success) {
      editorState.setEditingRule(null);
      editorState.setShowRuleEditor(false);
    }
    return success;
  };
  
  return handleSaveRule;
};

// Layout container component
const LayoutContainer: React.FC<{
  children: React.ReactNode;
  currentTab: number;
  onTabChange: (tab: number) => void;
  error: string | null;
  testResult: RulesTestResult | null;
  clearError: () => void;
}> = ({ children, currentTab, onTabChange, error, testResult, clearError }) => (
  <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <TabHeader currentTab={currentTab} onTabChange={onTabChange} />
    {error && (
      <Alert severity="error" sx={{ m: 2 }} onClose={clearError}>
        {error}
      </Alert>
    )}
    {testResult && <TestResults testResult={testResult} />}
    {children}
  </Box>
);

// Data loading effect
const useDataLoader = (currentTab: number, management: ReturnType<typeof useRulesManagement>): void => {
  useEffect(() => {
    if (currentTab === 0) management.loadRules();
    else if (currentTab === 1) management.loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTab]);
};

// Main component content
const ManagementContent: React.FC<{
  tabState: ReturnType<typeof useTabState>;
  editorState: ReturnType<typeof useRuleEditor>;
  management: ReturnType<typeof useRulesManagement>;
  handleSaveRule: (ruleData: NewRuleData) => Promise<boolean>;
  filteredRules: PipelineRule[];
}> = ({ tabState, editorState, management, handleSaveRule, filteredRules }) => (
  <>
    <MainContent
      currentTab={tabState.currentTab}
      selectedPhase={tabState.selectedPhase}
      onPhaseChange={tabState.setSelectedPhase}
      filteredRules={filteredRules}
      jobs={management.jobs}
      loading={management.loading}
      loadRules={management.loadRules}
      loadJobs={management.loadJobs}
      testRules={management.testRules}
      testOrchestrator={management.testOrchestrator}
      handleEditRule={editorState.handleEditRule}
      deleteRule={management.deleteRule}
      toggleRule={management.toggleRuleActive}
      setShowRuleEditor={editorState.setShowRuleEditor}
    />
    
    <RuleEditor 
      open={editorState.showRuleEditor} 
      editingRule={editorState.editingRule} 
      loading={management.loading} 
      onClose={editorState.handleCloseEditor} 
      onSave={handleSaveRule} 
    />
  </>
);

export const RulesManagement: React.FC = () => {
  const tabState = useTabState();
  const editorState = useRuleEditor();
  const management = useRulesManagement();
  const handleSaveRule = useSaveHandler(management, editorState);

  const filteredRules = tabState.selectedPhase 
    ? management.rules.filter(rule => rule.phase === tabState.selectedPhase) 
    : management.rules;

  useDataLoader(tabState.currentTab, management);

  return (
    <LayoutContainer
      currentTab={tabState.currentTab}
      onTabChange={tabState.setCurrentTab}
      error={management.error}
      testResult={management.testResult}
      clearError={management.clearError}
    >
      <ManagementContent
        tabState={tabState}
        editorState={editorState}
        management={management}
        handleSaveRule={handleSaveRule}
        filteredRules={filteredRules}
      />
    </LayoutContainer>
  );
};