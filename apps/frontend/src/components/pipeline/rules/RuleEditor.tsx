import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  PHASES, 
  RULE_TYPES, 
  type PipelineRule, 
  type NewRuleData 
} from './types';
import { 
  validateRule, 
  getConfigPlaceholder, 
  getConfigHelperText 
} from './validation';

interface RuleEditorProps {
  open: boolean;
  editingRule: PipelineRule | null;
  loading: boolean;
  onClose: () => void;
  onSave: (ruleData: NewRuleData) => Promise<boolean>;
}

const getInitialRuleData = (editingRule: PipelineRule | null): NewRuleData => {
  if (editingRule) {
    return {
      name: editingRule.name,
      phase: editingRule.phase,
      type: editingRule.type,
      target: editingRule.target,
      config: JSON.stringify(editingRule.config, null, 2),
      priority: editingRule.priority,
      is_active: editingRule.is_active
    };
  }
  
  return {
    name: '',
    phase: 'CLEAN',
    type: 'TRIM',
    target: '',
    config: '{}',
    priority: 100,
    is_active: true
  };
};

export const RuleEditor: React.FC<RuleEditorProps> = ({
  open,
  editingRule,
  loading,
  onClose,
  onSave
}) => {
  const [ruleData, setRuleData] = useState<NewRuleData>(() => 
    getInitialRuleData(editingRule)
  );
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setRuleData(getInitialRuleData(editingRule));
      setValidationErrors([]);
    }
  }, [open, editingRule]);

  const handlePhaseChange = (phase: string): void => {
    const availableTypes = RULE_TYPES[phase as keyof typeof RULE_TYPES] || [];
    setRuleData({
      ...ruleData, 
      phase,
      type: availableTypes[0] || 'TRIM'
    });
  };

  const handleSave = async (): Promise<void> => {
    const validation = validateRule(ruleData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    const success = await onSave(ruleData);
    if (success) {
      onClose();
    }
  };

  const availableRuleTypes = RULE_TYPES[ruleData.phase as keyof typeof RULE_TYPES] || [];

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle>
        {editingRule ? 'Edit Rule' : 'Add New Rule'}
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Create a new ETL rule for data processing pipeline
        </Typography>

        {validationErrors.length > 0 && (
          <Box sx={{ mt: 1, mb: 2 }}>
            {validationErrors.map((error, index) => (
              <Typography 
                key={index} 
                variant="body2" 
                color="error" 
                gutterBottom
              >
                {error}
              </Typography>
            ))}
          </Box>
        )}
        
        <Box sx={{ 
          mt: 2, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2 
        }}>
          <TextField
            label="Rule Name"
            value={ruleData.name}
            onChange={(e) => setRuleData({
              ...ruleData, 
              name: e.target.value
            })}
            placeholder="e.g., Convert Names to Uppercase"
            fullWidth
            required
          />
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Phase</InputLabel>
              <Select
                value={ruleData.phase}
                onChange={(e) => handlePhaseChange(e.target.value)}
                label="Phase"
              >
                {PHASES.map(phase => (
                  <MenuItem key={phase} value={phase}>
                    {phase}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Rule Type</InputLabel>
              <Select
                value={ruleData.type}
                onChange={(e) => setRuleData({
                  ...ruleData, 
                  type: e.target.value
                })}
                label="Rule Type"
              >
                {availableRuleTypes.map(type => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          <TextField
            label="Target Field"
            value={ruleData.target}
            onChange={(e) => setRuleData({
              ...ruleData, 
              target: e.target.value
            })}
            placeholder="e.g., name, manufacturer, assetTag"
            fullWidth
            required
          />
          
          <TextField
            label="Configuration (JSON)"
            value={ruleData.config}
            onChange={(e) => setRuleData({
              ...ruleData, 
              config: e.target.value
            })}
            placeholder={getConfigPlaceholder(ruleData.type)}
            multiline
            rows={3}
            fullWidth
            helperText={getConfigHelperText(ruleData.type)}
          />
          
          <TextField
            label="Priority"
            type="number"
            value={ruleData.priority}
            onChange={(e) => setRuleData({
              ...ruleData, 
              priority: parseInt(e.target.value) || 100
            })}
            helperText="Lower numbers = higher priority"
          />
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSave} 
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Rule'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};