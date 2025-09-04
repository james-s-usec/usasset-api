import React from 'react';
import { Typography, FormGroup, FormControlLabel, Switch, Paper } from '@mui/material';

// Tracer bullet: Placeholder for load rules configuration
export const LoadRules: React.FC = () => (
  <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
    <Typography variant="subtitle2" gutterBottom>
      Load Configuration
    </Typography>
    <FormGroup>
      <FormControlLabel 
        control={<Switch defaultChecked size="small" />}
        label="Skip invalid rows"
      />
      <FormControlLabel 
        control={<Switch defaultChecked size="small" />}
        label="Update existing records by asset tag"
      />
      <FormControlLabel 
        control={<Switch size="small" />}
        label="Create audit log entries"
      />
    </FormGroup>
    <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
      TODO: Add duplicate handling, merge strategies, batch size configuration
    </Typography>
  </Paper>
);