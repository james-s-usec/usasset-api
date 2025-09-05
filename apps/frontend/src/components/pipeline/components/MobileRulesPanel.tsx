import React from 'react';
import { Box, Paper } from '@mui/material';
import { RulesManagement } from '../rules/RulesManagement';

const DragHandle: React.FC = () => (
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
);

export const MobileRulesPanel: React.FC = () => (
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
    <DragHandle />
    <RulesManagement />
  </Paper>
);