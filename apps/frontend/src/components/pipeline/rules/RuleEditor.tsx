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

interface ValidationErrorsProps {
  errors: string[];
}

const ValidationErrors: React.FC<ValidationErrorsProps> = ({ errors }) => {
  if (errors.length === 0) return null;
  
  return (
    <Box sx={{ mt: 1, mb: 2 }}>
      {errors.map((error, index) => (
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
  );
};

interface PhaseTypeSelectorsProps {
  ruleData: NewRuleData;
  onPhaseChange: (phase: string) => void;
  onTypeChange: (type: string) => void;
}

const PhaseSelector: React.FC<{
  phase: string;
  onPhaseChange: (phase: string) => void;
}> = ({ phase, onPhaseChange }) => (
  <FormControl sx={{ minWidth: 120 }}>
    <InputLabel>Phase</InputLabel>
    <Select
      value={phase}
      onChange={(e) => onPhaseChange(e.target.value)}
      label="Phase"
    >
      {PHASES.map(p => (
        <MenuItem key={p} value={p}>
          {p}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

const TypeSelector: React.FC<{
  type: string;
  availableTypes: string[];
  onTypeChange: (type: string) => void;
}> = ({ type, availableTypes, onTypeChange }) => (
  <FormControl sx={{ minWidth: 200 }}>
    <InputLabel>Rule Type</InputLabel>
    <Select
      value={type}
      onChange={(e) => onTypeChange(e.target.value)}
      label="Rule Type"
    >
      {availableTypes.map(t => (
        <MenuItem key={t} value={t}>
          {t}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

const PhaseTypeSelectors: React.FC<PhaseTypeSelectorsProps> = ({ 
  ruleData, 
  onPhaseChange, 
  onTypeChange 
}) => {
  const availableRuleTypes = RULE_TYPES[ruleData.phase as keyof typeof RULE_TYPES] || [];
  
  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      <PhaseSelector phase={ruleData.phase} onPhaseChange={onPhaseChange} />
      <TypeSelector 
        type={ruleData.type} 
        availableTypes={[...availableRuleTypes]} 
        onTypeChange={onTypeChange} 
      />
    </Box>
  );
};

interface RuleFormFieldsProps {
  ruleData: NewRuleData;
  onChange: (updates: Partial<NewRuleData>) => void;
}

const RuleNameField: React.FC<RuleFormFieldsProps> = ({ ruleData, onChange }) => (
  <TextField
    label="Rule Name"
    value={ruleData.name}
    onChange={(e) => onChange({ name: e.target.value })}
    placeholder="e.g., Convert Names to Uppercase"
    fullWidth
    required
  />
);

const TargetField: React.FC<RuleFormFieldsProps> = ({ ruleData, onChange }) => (
  <TextField
    label="Target Field"
    value={ruleData.target}
    onChange={(e) => onChange({ target: e.target.value })}
    placeholder="e.g., name, manufacturer, assetTag"
    fullWidth
    required
  />
);

const BasicFields: React.FC<RuleFormFieldsProps> = ({ ruleData, onChange }) => (
  <>
    <RuleNameField ruleData={ruleData} onChange={onChange} />
    <PhaseTypeSelectors
      ruleData={ruleData}
      onPhaseChange={(phase) => {
        const availableTypes = RULE_TYPES[phase as keyof typeof RULE_TYPES] || [];
        onChange({ 
          phase,
          type: availableTypes[0] || 'TRIM'
        });
      }}
      onTypeChange={(type) => onChange({ type })}
    />
    <TargetField ruleData={ruleData} onChange={onChange} />
  </>
);

const ConfigFields: React.FC<RuleFormFieldsProps> = ({ ruleData, onChange }) => (
  <>
    <TextField
      label="Configuration (JSON)"
      value={ruleData.config}
      onChange={(e) => onChange({ config: e.target.value })}
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
      onChange={(e) => onChange({ 
        priority: parseInt(e.target.value) || 100 
      })}
      helperText="Lower numbers = higher priority"
    />
  </>
);

const RuleFormFields: React.FC<RuleFormFieldsProps> = ({ ruleData, onChange }) => (
  <Box sx={{ 
    mt: 2, 
    display: 'flex', 
    flexDirection: 'column', 
    gap: 2 
  }}>
    <BasicFields ruleData={ruleData} onChange={onChange} />
    <ConfigFields ruleData={ruleData} onChange={onChange} />
  </Box>
);

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

const useRuleState = (open: boolean, editingRule: PipelineRule | null): {
  ruleData: NewRuleData;
  setRuleData: React.Dispatch<React.SetStateAction<NewRuleData>>;
  validationErrors: string[];
  setValidationErrors: React.Dispatch<React.SetStateAction<string[]>>;
} => {
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

  return { ruleData, setRuleData, validationErrors, setValidationErrors };
};

const useRuleActions = (params: {
  ruleData: NewRuleData;
  setRuleData: React.Dispatch<React.SetStateAction<NewRuleData>>;
  setValidationErrors: React.Dispatch<React.SetStateAction<string[]>>;
  onSave: (ruleData: NewRuleData) => Promise<boolean>;
  onClose: () => void;
}): {
  handleSave: () => Promise<void>;
  handleRuleDataChange: (updates: Partial<NewRuleData>) => void;
} => {
  const { ruleData, setRuleData, setValidationErrors, onSave, onClose } = params;
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

  const handleRuleDataChange = (updates: Partial<NewRuleData>): void => {
    setRuleData({ ...ruleData, ...updates });
  };

  return { handleSave, handleRuleDataChange };
};

const useRuleEditor = (
  open: boolean,
  editingRule: PipelineRule | null,
  onSave: (ruleData: NewRuleData) => Promise<boolean>,
  onClose: () => void
): {
  ruleData: NewRuleData;
  validationErrors: string[];
  handleSave: () => Promise<void>;
  handleRuleDataChange: (updates: Partial<NewRuleData>) => void;
} => {
  const { ruleData, setRuleData, validationErrors, setValidationErrors } = 
    useRuleState(open, editingRule);
  
  const { handleSave, handleRuleDataChange } = useRuleActions({
    ruleData, setRuleData, setValidationErrors, onSave, onClose
  });

  return { ruleData, validationErrors, handleSave, handleRuleDataChange };
};

const RuleDialogContent: React.FC<{
  editingRule: PipelineRule | null;
  validationErrors: string[];
  ruleData: NewRuleData;
  onChange: (updates: Partial<NewRuleData>) => void;
}> = ({ editingRule, validationErrors, ruleData, onChange }) => (
  <DialogContent>
    <Typography variant="body2" color="text.secondary" gutterBottom>
      {editingRule ? 'Edit' : 'Create a new'} ETL rule for data processing pipeline
    </Typography>
    <ValidationErrors errors={validationErrors} />
    <RuleFormFields ruleData={ruleData} onChange={onChange} />
  </DialogContent>
);

const RuleDialogActions: React.FC<{
  loading: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
}> = ({ loading, onClose, onSave }) => (
  <DialogActions>
    <Button onClick={onClose} disabled={loading}>
      Cancel
    </Button>
    <Button 
      variant="contained" 
      onClick={onSave} 
      disabled={loading}
    >
      {loading ? 'Saving...' : 'Save Rule'}
    </Button>
  </DialogActions>
);

export const RuleEditor: React.FC<RuleEditorProps> = (props) => {
  const { open, editingRule, loading, onClose, onSave } = props;
  const editorState = useRuleEditor(open, editingRule, onSave, onClose);

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
      
      <RuleDialogContent
        editingRule={editingRule}
        validationErrors={editorState.validationErrors}
        ruleData={editorState.ruleData}
        onChange={editorState.handleRuleDataChange}
      />
      
      <RuleDialogActions
        loading={loading}
        onClose={onClose}
        onSave={editorState.handleSave}
      />
    </Dialog>
  );
};