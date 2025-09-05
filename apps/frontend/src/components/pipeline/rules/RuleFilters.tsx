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

export const RuleFilters: React.FC<RuleFiltersProps> = ({
  selectedPhase,
  onPhaseChange,
  onRefresh,
  onAddRule,
  onTestRules,
  onTestOrchestrator,
  loading
}) => {
  return (
    <Box sx={{ 
      p: 2, 
      borderBottom: 1, 
      borderColor: 'divider' 
    }}>
      <Box sx={{ 
        display: 'flex', 
        gap: 1, 
        alignItems: 'center', 
        flexWrap: 'wrap' 
      }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Phase Filter</InputLabel>
          <Select
            value={selectedPhase}
            onChange={(e) => onPhaseChange(e.target.value)}
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
        
        <Divider orientation="vertical" flexItem />
        
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
      </Box>
    </Box>
  );
};