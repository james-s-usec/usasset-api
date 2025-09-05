import React, { useState } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { PipelineFlow } from './PipelineFlow';
import { PipelineToolbar } from './components/PipelineToolbar';
import { MobileRulesPanel } from './components/MobileRulesPanel';
import { SplitPanelLayout } from './components/SplitPanelLayout';

interface PipelineWithRulesProps {
  selectedFile: string | null;
  selectedFileName: string | null;
  currentJobId: string | null;
  importError: string | null;
  onSelectFile: () => void;
  onStartImport: () => Promise<void>;
}

export const PipelineWithRules: React.FC<PipelineWithRulesProps> = (props) => {
  const [showRulesPanel, setShowRulesPanel] = useState(true);
  const [rulesWidth, setRulesWidth] = useState(40);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const actuallyShowRules = showRulesPanel && !isMobile;
  const pipelineWidth = actuallyShowRules ? (100 - rulesWidth) : 100;

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <PipelineToolbar
        actuallyShowRules={actuallyShowRules}
        isMobile={isMobile}
        pipelineWidth={pipelineWidth}
        rulesWidth={rulesWidth}
        onToggleRules={() => setShowRulesPanel(!showRulesPanel)}
      />
      <SplitPanelLayout
        actuallyShowRules={actuallyShowRules}
        pipelineWidth={pipelineWidth}
        rulesWidth={rulesWidth}
        onWidthChange={setRulesWidth}
        pipelineContent={<PipelineFlow {...props} />}
      />
      {isMobile && showRulesPanel && <MobileRulesPanel />}
    </Box>
  );
};