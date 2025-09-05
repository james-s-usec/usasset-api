import React from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  PlayArrow as TestIcon
} from '@mui/icons-material';
import { PHASES } from './types';

interface RuleFiltersProps {
  selectedPhase: string;
  onPhaseChange: (phase: string) => void;
  onRefresh: () => void;
  onAddRule: () => void;
  onTestRules: () => void;
  onTestOrchestrator: () => void;
  loading: boolean;
}

const PhaseSelector: React.FC<{
  selectedPhase: string;
  onPhaseChange: (phase: string) => void;
}> = ({ selectedPhase, onPhaseChange }) => (
  <FormControl size="small" sx={{ minWidth: 120 }}>
    <InputLabel>Phase Filter</InputLabel>
    <Select
      value={selectedPhase}
      onChange={(e): void => onPhaseChange(e.target.value)}
      label="Phase Filter"
    >
      <MenuItem value="">All Phases</MenuItem>
      {PHASES.map(phase => (
        <MenuItem key={phase} value={phase}>
          {phase}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

const UtilityButtons: React.FC<{
  onRefresh: () => void;
  onAddRule: () => void;
  loading: boolean;
}> = ({ onRefresh, onAddRule, loading }) => (
  <>
    <Button 
      variant="outlined" 
      size="small" 
      startIcon={<RefreshIcon />} 
      onClick={onRefresh} 
      disabled={loading}
    >
      Refresh
    </Button>
    <Button 
      variant="outlined" 
      size="small" 
      startIcon={<AddIcon />} 
      onClick={onAddRule}
    >
      Add Rule
    </Button>
  </>
);

const TestButtons: React.FC<{
  onTestRules: () => void;
  onTestOrchestrator: () => void;
  loading: boolean;
}> = ({ onTestRules, onTestOrchestrator, loading }) => (
  <>
    <Button 
      variant="contained" 
      size="small" 
      startIcon={<TestIcon />} 
      onClick={onTestRules} 
      disabled={loading} 
      color="primary"
    >
      Test Rules
    </Button>
    <Button 
      variant="contained" 
      size="small" 
      startIcon={<TestIcon />} 
      onClick={onTestOrchestrator} 
      disabled={loading} 
      color="secondary"
    >
      Test Orchestrator
    </Button>
  </>
);

const ActionButtons: React.FC<{
  onRefresh: () => void;
  onAddRule: () => void;
  onTestRules: () => void;
  onTestOrchestrator: () => void;
  loading: boolean;
}> = ({ onRefresh, onAddRule, onTestRules, onTestOrchestrator, loading }) => (
  <>
    <UtilityButtons 
      onRefresh={onRefresh} 
      onAddRule={onAddRule} 
      loading={loading} 
    />
    <Divider orientation="vertical" flexItem />
    <TestButtons 
      onTestRules={onTestRules} 
      onTestOrchestrator={onTestOrchestrator} 
      loading={loading} 
    />
  </>
);

export const RuleFilters: React.FC<RuleFiltersProps> = (props) => (
  <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
      <PhaseSelector selectedPhase={props.selectedPhase} onPhaseChange={props.onPhaseChange} />
      <ActionButtons 
        onRefresh={props.onRefresh}
        onAddRule={props.onAddRule}
        onTestRules={props.onTestRules}
        onTestOrchestrator={props.onTestOrchestrator}
        loading={props.loading}
      />
    </Box>
  </Box>
);