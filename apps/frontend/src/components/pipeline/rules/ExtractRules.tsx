import React from 'react';
import { Box, Typography, Chip, Paper } from '@mui/material';
import { useExtractRules } from './hooks/useExtractRules';


const DefaultParsingOptions: React.FC = () => (
  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
    <Chip label="CSV Parser: Default" size="small" />
    <Chip label="Delimiter: Comma" size="small" />
    <Chip label="Header Row: First" size="small" />
    <Chip label="Encoding: UTF-8" size="small" />
  </Box>
);

const NoRulesMessage: React.FC = () => (
  <Box>
    <Typography variant="body2" color="text.secondary" gutterBottom>
      No extraction rules configured yet.
    </Typography>
    <DefaultParsingOptions />
  </Box>
);

const RulesDisplay: React.FC<{ rules: Array<{ id: string; name: string; type: string; is_active: boolean }> }> = ({ rules }) => (
  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
    {rules.map((rule) => (
      <Chip 
        key={rule.id}
        label={`${rule.name} (${rule.type})`}
        size="small"
        color={rule.is_active ? 'primary' : 'default'}
        variant={rule.is_active ? 'filled' : 'outlined'}
      />
    ))}
  </Box>
);

const HelpText: React.FC<{ hasRules: boolean }> = ({ hasRules }) => (
  <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
    {hasRules 
      ? 'Manage extraction rules in the Rules tab'
      : 'Create extraction rules in the Rules tab for custom CSV parsing, delimiter detection, and encoding'
    }
  </Typography>
);

export const ExtractRules: React.FC = () => {
  const { rules, loading } = useExtractRules();

  return (
    <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
      <Typography variant="subtitle2" gutterBottom>
        Extraction Rules ({rules.filter(r => r.is_active).length} Active)
      </Typography>
      
      {loading ? (
        <Typography variant="body2" color="text.secondary">Loading rules...</Typography>
      ) : rules.length === 0 ? (
        <NoRulesMessage />
      ) : (
        <RulesDisplay rules={rules} />
      )}
      
      <HelpText hasRules={rules.length > 0} />
    </Paper>
  );
};