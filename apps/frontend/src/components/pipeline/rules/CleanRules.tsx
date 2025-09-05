import React from 'react';
import { Typography, List, ListItem, ListItemIcon, ListItemText, Paper, Chip, Box } from '@mui/material';
import { Check, Pause } from '@mui/icons-material';
import { useCleanRules } from './hooks/useCleanRules';


const RulesList: React.FC<{ rules: Array<{ id: string; name: string; type: string; target: string; is_active: boolean }> }> = ({ rules }) => (
  <List dense>
    {rules.length === 0 ? (
      <ListItem>
        <ListItemText 
          primary="No active clean rules" 
          secondary="Create rules in the Rules Management tab to see them here"
        />
      </ListItem>
    ) : (
      rules.map((rule) => (
        <ListItem key={rule.id}>
          <ListItemIcon>
            {rule.is_active ? <Check fontSize="small" /> : <Pause fontSize="small" />}
          </ListItemIcon>
          <ListItemText 
            primary={rule.name} 
            secondary={
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                <Chip label={rule.type} size="small" />
                <Typography variant="caption">Target: {rule.target}</Typography>
              </Box>
            }
          />
        </ListItem>
      ))
    )}
  </List>
);

export const CleanRules: React.FC = () => {
  const { rules, loading } = useCleanRules();

  return (
    <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
      <Typography variant="subtitle2" gutterBottom>
        Cleaning Rules ({rules.filter(r => r.is_active).length} Active)
      </Typography>
      {loading ? (
        <Typography variant="body2" color="text.secondary">Loading rules...</Typography>
      ) : (
        <RulesList rules={rules} />
      )}
      {rules.length > 0 && (
        <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
          These rules will be applied during the CLEAN phase to normalize and clean your data
        </Typography>
      )}
    </Paper>
  );
};