import React from 'react';
import { Typography, List, ListItem, ListItemIcon, ListItemText, Paper } from '@mui/material';
import { Check, Warning } from '@mui/icons-material';

const RulesList: React.FC = () => (
  <List dense>
    <ListItem>
      <ListItemIcon><Check fontSize="small" /></ListItemIcon>
      <ListItemText primary="Required Field Validation" secondary="Asset Tag, Name must be present" />
    </ListItem>
    <ListItem>
      <ListItemIcon><Warning fontSize="small" /></ListItemIcon>
      <ListItemText primary="Field Mapping" secondary="Asset ID → assetTag, Building → buildingName" />
    </ListItem>
    <ListItem>
      <ListItemIcon><Check fontSize="small" /></ListItemIcon>
      <ListItemText primary="Default Values" secondary="Status: ACTIVE, Condition: GOOD" />
    </ListItem>
  </List>
);

export const TransformRules: React.FC = () => (
  <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
    <Typography variant="subtitle2" gutterBottom>
      Transformation Rules (Active)
    </Typography>
    <RulesList />
    <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
      TODO: Add data cleaning rules, fuzzy matching, custom validators
    </Typography>
  </Paper>
);