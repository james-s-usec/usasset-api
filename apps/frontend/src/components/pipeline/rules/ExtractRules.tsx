import React, { useEffect, useState } from 'react';
import { Box, Typography, Chip, Paper } from '@mui/material';
import type { PipelineRule } from './types';
import config from '../../../config';

interface ExtractRule {
  id: string;
  name: string;
  type: string;
  target: string;
  is_active: boolean;
}

export const ExtractRules: React.FC = () => {
  const [rules, setRules] = useState<ExtractRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExtractRules = async (): Promise<void> => {
      try {
        const response = await fetch(`${config.api.baseUrl}/api/pipeline/rules`);
        const data = await response.json();
        
        if (data.success) {
          // Filter for EXTRACT phase rules only
          const extractRules = data.data.rules.filter((rule: PipelineRule) => 
            rule.phase === 'EXTRACT'
          );
          setRules(extractRules);
        }
      } catch (error) {
        console.error('Failed to fetch extract rules:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExtractRules();
  }, []);

  return (
    <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
      <Typography variant="subtitle2" gutterBottom>
        Extraction Rules ({rules.filter(r => r.is_active).length} Active)
      </Typography>
      
      {loading ? (
        <Typography variant="body2" color="text.secondary">Loading rules...</Typography>
      ) : rules.length === 0 ? (
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            No extraction rules configured yet.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
            <Chip label="CSV Parser: Default" size="small" />
            <Chip label="Delimiter: Comma" size="small" />
            <Chip label="Header Row: First" size="small" />
            <Chip label="Encoding: UTF-8" size="small" />
          </Box>
        </Box>
      ) : (
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
      )}
      
      <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
        {rules.length > 0 
          ? 'Manage extraction rules in the Rules tab'
          : 'Create extraction rules in the Rules tab for custom CSV parsing, delimiter detection, and encoding'
        }
      </Typography>
    </Paper>
  );
};