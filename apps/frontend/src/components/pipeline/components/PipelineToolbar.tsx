import React from 'react';
import {
  Box,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ViewSidebar as SidebarIcon,
  ViewSidebarOutlined as SidebarOutlinedIcon
} from '@mui/icons-material';

interface PipelineToolbarProps {
  actuallyShowRules: boolean;
  isMobile: boolean;
  pipelineWidth: number;
  rulesWidth: number;
  onToggleRules: () => void;
}

// Toolbar toggle button component
const ToggleButton: React.FC<{
  actuallyShowRules: boolean;
  onToggleRules: () => void;
}> = ({ actuallyShowRules, onToggleRules }) => (
  <Tooltip title={actuallyShowRules ? "Hide Rules Panel" : "Show Rules Panel"}>
    <IconButton 
      onClick={onToggleRules}
      color={actuallyShowRules ? "primary" : "default"}
    >
      {actuallyShowRules ? <SidebarIcon /> : <SidebarOutlinedIcon />}
    </IconButton>
  </Tooltip>
);

// Pipeline status display
const PipelineStatus: React.FC<{
  actuallyShowRules: boolean;
  pipelineWidth: number;
  rulesWidth: number;
}> = ({ actuallyShowRules, pipelineWidth, rulesWidth }) => (
  <Box sx={{ fontSize: '14px', color: 'text.secondary' }}>
    {actuallyShowRules 
      ? `Pipeline (${pipelineWidth.toFixed(0)}%) | Rules (${rulesWidth.toFixed(0)}%)`
      : 'Pipeline View'
    }
  </Box>
);

// Mobile notice component
const MobileNotice: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
  if (!isMobile) return null;
  return (
    <Box sx={{ fontSize: '12px', color: 'text.secondary' }}>
      Rules panel hidden on mobile
    </Box>
  );
};

// Main toolbar component - under 30 lines
export const PipelineToolbar: React.FC<PipelineToolbarProps> = ({
  actuallyShowRules,
  isMobile,
  pipelineWidth,
  rulesWidth,
  onToggleRules
}) => (
  <Box sx={{ 
    p: 1, 
    borderBottom: 1, 
    borderColor: 'divider',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'background.paper'
  }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <ToggleButton actuallyShowRules={actuallyShowRules} onToggleRules={onToggleRules} />
      <PipelineStatus 
        actuallyShowRules={actuallyShowRules}
        pipelineWidth={pipelineWidth}
        rulesWidth={rulesWidth}
      />
    </Box>
    <MobileNotice isMobile={isMobile} />
  </Box>
);