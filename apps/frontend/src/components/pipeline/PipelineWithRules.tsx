import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  // Divider, 
  IconButton, 
  Tooltip, 
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ViewSidebar as SidebarIcon,
  ViewSidebarOutlined as SidebarOutlinedIcon
} from '@mui/icons-material';
import { PipelineFlow } from './PipelineFlow';
import { RulesManagement } from './rules/RulesManagement';

interface PipelineWithRulesProps {
  selectedFile: string | null;
  selectedFileName: string | null;
  currentJobId: string | null;
  importError: string | null;
  onSelectFile: () => void;
  onStartImport: () => Promise<void>;
}

export const PipelineWithRules: React.FC<PipelineWithRulesProps> = ({
  selectedFile,
  selectedFileName,
  currentJobId,
  importError,
  onSelectFile,
  onStartImport
}) => {
  const [showRulesPanel, setShowRulesPanel] = useState(true);
  const [rulesWidth, setRulesWidth] = useState(40); // Percentage
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Force single panel on mobile
  const actuallyShowRules = showRulesPanel && !isMobile;
  const pipelineWidth = actuallyShowRules ? (100 - rulesWidth) : 100;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rulesWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = startX - e.clientX;
      const containerWidth = window.innerWidth;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newWidth = Math.min(Math.max(startWidth + deltaPercent, 25), 75);
      setRulesWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header with toggle */}
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
          <Tooltip title={actuallyShowRules ? "Hide Rules Panel" : "Show Rules Panel"}>
            <IconButton 
              onClick={() => setShowRulesPanel(!showRulesPanel)}
              color={actuallyShowRules ? "primary" : "default"}
            >
              {actuallyShowRules ? <SidebarIcon /> : <SidebarOutlinedIcon />}
            </IconButton>
          </Tooltip>
          
          <Box sx={{ fontSize: '14px', color: 'text.secondary' }}>
            {actuallyShowRules 
              ? `Pipeline (${pipelineWidth.toFixed(0)}%) | Rules (${rulesWidth.toFixed(0)}%)`
              : 'Pipeline View'
            }
          </Box>
        </Box>

        {isMobile && (
          <Box sx={{ fontSize: '12px', color: 'text.secondary' }}>
            Rules panel hidden on mobile
          </Box>
        )}
      </Box>

      {/* Split Panel Layout */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Left Panel - Pipeline Flow */}
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
          <PipelineFlow
            selectedFile={selectedFile}
            selectedFileName={selectedFileName}
            currentJobId={currentJobId}
            importError={importError}
            onSelectFile={onSelectFile}
            onStartImport={onStartImport}
          />
        </Paper>

        {/* Resizable Divider */}
        {actuallyShowRules && (
          <Box
            onMouseDown={handleMouseDown}
            sx={{
              width: 8,
              cursor: 'col-resize',
              backgroundColor: 'divider',
              '&:hover': {
                backgroundColor: 'primary.main',
                opacity: 0.7
              },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            <Box sx={{
              width: 2,
              height: 40,
              backgroundColor: 'background.paper',
              borderRadius: 1
            }} />
          </Box>
        )}

        {/* Right Panel - Rules Management */}
        {actuallyShowRules && (
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
        )}
      </Box>

      {/* Mobile Rules Panel (Bottom Sheet Style) */}
      {isMobile && showRulesPanel && (
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '50%',
            zIndex: 1000,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16
          }}
        >
          <Box sx={{
            p: 1,
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <Box sx={{
              width: 40,
              height: 4,
              backgroundColor: 'text.secondary',
              borderRadius: 2,
              opacity: 0.3
            }} />
          </Box>
          <RulesManagement />
        </Paper>
      )}
    </Box>
  );
};