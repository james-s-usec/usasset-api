import React from 'react';
import { Box, Paper } from '@mui/material';
import { ResizableDivider } from './ResizableDivider';
import { RulesManagement } from '../rules/RulesManagement';

interface SplitPanelLayoutProps {
  actuallyShowRules: boolean;
  pipelineWidth: number;
  rulesWidth: number;
  onWidthChange: (width: number) => void;
  pipelineContent: React.ReactNode;
}

// Pipeline panel component
const PipelinePanel: React.FC<{
  pipelineWidth: number;
  pipelineContent: React.ReactNode;
}> = ({ pipelineWidth, pipelineContent }) => (
  <Paper 
    elevation={0}
    sx={{ 
      width: `${pipelineWidth}%`,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'auto',
      backgroundColor: 'background.default'
    }}
  >
    {pipelineContent}
  </Paper>
);

// Rules panel component
const RulesPanel: React.FC<{ rulesWidth: number }> = ({ rulesWidth }) => (
  <Paper 
    elevation={1}
    sx={{ 
      width: `${rulesWidth}%`,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      backgroundColor: 'background.paper'
    }}
  >
    <RulesManagement />
  </Paper>
);

// Main layout component - under 30 lines
export const SplitPanelLayout: React.FC<SplitPanelLayoutProps> = ({
  actuallyShowRules,
  pipelineWidth,
  rulesWidth,
  onWidthChange,
  pipelineContent
}) => (
  <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
    <PipelinePanel pipelineWidth={pipelineWidth} pipelineContent={pipelineContent} />
    
    {actuallyShowRules && (
      <ResizableDivider rulesWidth={rulesWidth} onWidthChange={onWidthChange} />
    )}
    
    {actuallyShowRules && (
      <RulesPanel rulesWidth={rulesWidth} />
    )}
  </Box>
);