import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as TestIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

interface PipelineRule {
  id: string;
  name: string;
  description?: string;
  phase: string;
  type: string;
  target: string;
  config: any;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface RulesTestResult {
  success: boolean;
  testData: {
    before: any;
    after: any;
  };
  rulesApplied: Array<{
    name: string;
    type: string;
    phase: string;
    target: string;
  }>;
  processing: {
    errors: string[];
    warnings: string[];
  };
}

interface ImportJob {
  id: string;
  file_id: string;
  status: string;
  total_rows: number | null;
  processed_rows: number | null;
  error_rows: number | null;
  errors: string[] | null;
  started_at: string;
  completed_at: string | null;
  created_by: string | null;
}

export const RulesManagement: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [rules, setRules] = useState<PipelineRule[]>([]);
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<RulesTestResult | null>(null);
  const [showRuleEditor, setShowRuleEditor] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<string>('');
  const [editingRule, setEditingRule] = useState<PipelineRule | null>(null);
  const [newRule, setNewRule] = useState({
    name: '',
    phase: 'CLEAN',
    type: 'TRIM',
    target: '',
    config: '{}',
    priority: 100,
    is_active: true
  });

  const phases = ['EXTRACT', 'VALIDATE', 'CLEAN', 'TRANSFORM', 'MAP', 'LOAD'];
  const ruleTypes = {
    EXTRACT: ['ENCODING_DETECTOR', 'COLUMN_MAPPER', 'DELIMITER_DETECTOR', 'HEADER_VALIDATOR'],
    VALIDATE: ['REQUIRED_FIELD', 'DATA_TYPE_CHECK', 'RANGE_VALIDATOR', 'FORMAT_VALIDATOR'],
    CLEAN: ['TRIM', 'REGEX_REPLACE', 'EXACT_REPLACE', 'REMOVE_DUPLICATES'],
    TRANSFORM: ['TO_UPPERCASE', 'TO_LOWERCASE', 'TITLE_CASE', 'DATE_FORMAT', 'NUMERIC_FORMAT', 'CALCULATE_FIELD'],
    MAP: ['FIELD_MAPPING', 'ENUM_MAPPING', 'REFERENCE_LOOKUP', 'DEFAULT_VALUE'],
    LOAD: ['CONFLICT_RESOLUTION', 'BATCH_SIZE', 'TRANSACTION_BOUNDARY', 'ROLLBACK_STRATEGY']
  };
  console.log('Available rule types:', ruleTypes); // Use it to avoid unused variable error

  useEffect(() => {
    if (currentTab === 0) {
      loadRules();
    } else if (currentTab === 1) {
      loadJobs();
    }
  }, [currentTab]);

  const loadRules = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/pipeline/rules`);
      const data = await response.json();
      if (data.success) {
        setRules(data.data.rules || []);
      } else {
        throw new Error(data.error?.message || 'Failed to load rules');
      }
    } catch (err) {
      setError('Failed to load rules');
      console.error('Error loading rules:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/pipeline/jobs`);
      const data = await response.json();
      if (data.success) {
        setJobs(data.data.jobs || []);
      } else {
        throw new Error(data.error?.message || 'Failed to load jobs');
      }
    } catch (err) {
      setError('Failed to load jobs');
      console.error('Error loading jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const testRules = async () => {
    // DRY: Use orchestrator instead of duplicate test-rules endpoint
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/pipeline/test-orchestrator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      
      if (data.success) {
        // Extract rules from orchestrator phases
        const allRulesApplied: any[] = [];
        if (data.data?.data?.phases) {
          data.data.data.phases.forEach((phase: any) => {
            if (phase.debug?.rulesApplied) {
              phase.debug.rulesApplied.forEach((ruleName: string) => {
                allRulesApplied.push({
                  name: ruleName,
                  type: 'Unknown', // Orchestrator doesn't provide type details
                  phase: phase.phase,
                  target: 'Multiple',
                });
              });
            }
          });
        }

        // Get before/after data from first and last phases
        const firstPhase = data.data?.data?.phases?.[0];
        const lastPhase = data.data?.data?.phases?.[data.data?.data?.phases?.length - 1];

        setTestResult({
          success: true,
          testData: {
            before: firstPhase?.data?.rows?.[0] || {},
            after: lastPhase?.data?.mappedRows?.[0] || lastPhase?.data?.rows?.[0] || {},
          },
          rulesApplied: allRulesApplied,
          processing: {
            errors: [],
            warnings: [],
          },
        });
      } else {
        setError('Orchestrator test failed');
      }
    } catch (err) {
      setError('Failed to test orchestrator');
      console.error('Error testing orchestrator:', err);
    } finally {
      setLoading(false);
    }
  };

  const testOrchestrator = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/pipeline/test-orchestrator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      
      if (data.success) {
        // Show orchestrator results in a different way
        console.log('Orchestrator test results:', data.data);
        setError(null);
        alert(`Orchestrator test completed! ${data.data.data.summary.phasesCompleted} phases executed successfully in ${data.data.data.totalDuration}ms`);
      } else {
        setError('Orchestrator test failed');
      }
    } catch (err) {
      setError('Failed to test orchestrator');
    } finally {
      setLoading(false);
    }
  };

  const saveRule = async () => {
    if (!newRule.name.trim() || !newRule.target.trim()) {
      setError('Name and Target fields are required');
      return;
    }

    setLoading(true);
    try {
      const url = editingRule 
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/pipeline/rules/${editingRule.id}`
        : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/pipeline/rules`;
      
      const method = editingRule ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRule.name.trim(),
          phase: newRule.phase,
          type: newRule.type,
          target: newRule.target.trim(),
          config: JSON.parse(newRule.config),
          priority: newRule.priority,
          is_active: newRule.is_active
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowRuleEditor(false);
        setEditingRule(null);
        setNewRule({
          name: '',
          phase: 'CLEAN',
          type: 'TRIM',
          target: '',
          config: '{}',
          priority: 100,
          is_active: true
        });
        loadRules(); // Refresh the rules list
      } else {
        setError(data.error?.message || `Failed to ${editingRule ? 'update' : 'create'} rule`);
      }
    } catch (err) {
      setError('Failed to save rule');
      console.error('Error saving rule:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/pipeline/rules/${ruleId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        loadRules(); // Refresh the rules list
      } else {
        setError(data.error?.message || 'Failed to delete rule');
      }
    } catch (err) {
      setError('Failed to delete rule');
      console.error('Error deleting rule:', err);
    } finally {
      setLoading(false);
    }
  };

  const editRule = (rule: PipelineRule) => {
    setEditingRule(rule);
    setNewRule({
      name: rule.name,
      phase: rule.phase,
      type: rule.type,
      target: rule.target,
      config: JSON.stringify(rule.config, null, 2),
      priority: rule.priority,
      is_active: rule.is_active
    });
    setShowRuleEditor(true);
  };

  const filteredRules = selectedPhase 
    ? rules.filter(rule => rule.phase === selectedPhase)
    : rules;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ p: 2, pb: 1 }}>
          ETL Management
        </Typography>
        
        <Tabs 
          value={currentTab} 
          onChange={(_, newValue) => setCurrentTab(newValue)}
          sx={{ px: 2 }}
        >
          <Tab label="Rules" />
          <Tab label="Jobs" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {/* Tab Content */}
      {currentTab === 0 && (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Rules Tab Content */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Phase Filter</InputLabel>
            <Select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
              label="Phase Filter"
            >
              <MenuItem value="">All Phases</MenuItem>
              {phases.map(phase => (
                <MenuItem key={phase} value={phase}>{phase}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={loadRules}
            disabled={loading}
          >
            Refresh
          </Button>
          
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setShowRuleEditor(true)}
          >
            Add Rule
          </Button>
          
          <Divider orientation="vertical" flexItem />
          
          <Button
            variant="contained"
            size="small"
            startIcon={<TestIcon />}
            onClick={testRules}
            disabled={loading}
            color="primary"
          >
            Test Rules
          </Button>
          
          <Button
            variant="contained"
            size="small"
            startIcon={<TestIcon />}
            onClick={testOrchestrator}
            disabled={loading}
            color="secondary"
          >
            Test Orchestrator
          </Button>
        </Box>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ m: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Test Results Display */}
      {testResult && (
        <Box sx={{ m: 2 }}>
          <Alert severity={testResult.success ? "success" : "error"}>
            <Typography variant="subtitle2">Rule Test Results:</Typography>
            <Typography variant="body2">
              Applied {testResult.rulesApplied.length} rules
            </Typography>
            {testResult.processing.errors.length > 0 && (
              <Typography variant="body2" color="error">
                Errors: {testResult.processing.errors.join(', ')}
              </Typography>
            )}
          </Alert>
          
          {/* Before/After Data */}
          <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Before:</Typography>
              <pre style={{ fontSize: '12px', overflow: 'auto', maxHeight: '200px' }}>
                {JSON.stringify(testResult.testData.before, null, 2)}
              </pre>
            </Paper>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>After:</Typography>
              <pre style={{ fontSize: '12px', overflow: 'auto', maxHeight: '200px' }}>
                {JSON.stringify(testResult.testData.after, null, 2)}
              </pre>
            </Paper>
          </Box>
        </Box>
      )}

      {/* Rules Table */}
      <Box sx={{ flex: 1, overflow: 'auto', m: 2 }}>
        <TableContainer component={Paper}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Active</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Phase</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Target</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary">
                      No rules found. Click "Test Rules" to auto-create demo rules.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRules.map((rule) => (
                  <TableRow key={rule.id} hover>
                    <TableCell>
                      <Switch
                        checked={rule.is_active}
                        size="small"
                        // onChange={() => toggleRule(rule.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {rule.name}
                      </Typography>
                      {rule.description && (
                        <Typography variant="caption" color="text.secondary">
                          {rule.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={rule.phase} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip label={rule.type} size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {rule.target}
                      </Typography>
                    </TableCell>
                    <TableCell>{rule.priority}</TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => editRule(rule)}
                        disabled={loading}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => deleteRule(rule.id)}
                        disabled={loading}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        </Box>
        </Box>
      )}

      {/* Jobs Tab Content */}
      {currentTab === 1 && (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={loadJobs}
                disabled={loading}
              >
                Refresh Jobs
              </Button>
            </Box>
          </Box>

          {/* Jobs Table */}
          <Box sx={{ flex: 1, overflow: 'auto', m: 2 }}>
            <TableContainer component={Paper}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Job ID</TableCell>
                    <TableCell>File ID</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Progress</TableCell>
                    <TableCell>Started</TableCell>
                    <TableCell>Completed</TableCell>
                    <TableCell>Errors</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {jobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography color="text.secondary">
                          No import jobs found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    jobs.map((job) => (
                      <TableRow key={job.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {job.id.substring(0, 8)}...
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {job.file_id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={job.status} 
                            size="small" 
                            color={
                              job.status === 'COMPLETED' ? 'success' :
                              job.status === 'FAILED' ? 'error' :
                              job.status === 'RUNNING' ? 'primary' : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {job.total_rows && (
                            <Typography variant="body2">
                              {job.processed_rows || 0} / {job.total_rows}
                              {job.error_rows && job.error_rows > 0 && (
                                <span style={{ color: 'red' }}> ({job.error_rows} errors)</span>
                              )}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(job.started_at).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {job.completed_at ? new Date(job.completed_at).toLocaleString() : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {job.errors && job.errors.length > 0 && (
                            <Chip 
                              label={`${job.errors.length} errors`} 
                              size="small" 
                              color="error" 
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      )}
      
      {/* Rule Editor Dialog */}
      <Dialog open={showRuleEditor} onClose={() => {
        setShowRuleEditor(false);
        setEditingRule(null);
      }} maxWidth="md" fullWidth>
        <DialogTitle>{editingRule ? 'Edit Rule' : 'Add New Rule'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Create a new ETL rule for data processing pipeline
          </Typography>
          
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Rule Name"
              value={newRule.name}
              onChange={(e) => setNewRule({...newRule, name: e.target.value})}
              placeholder="e.g., Convert Names to Uppercase"
              fullWidth
              required
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Phase</InputLabel>
                <Select
                  value={newRule.phase}
                  onChange={(e) => {
                    const phase = e.target.value;
                    const availableTypes = ruleTypes[phase as keyof typeof ruleTypes] || [];
                    setNewRule({
                      ...newRule, 
                      phase,
                      type: availableTypes[0] || 'TRIM'
                    });
                  }}
                  label="Phase"
                >
                  {phases.map(phase => (
                    <MenuItem key={phase} value={phase}>{phase}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Rule Type</InputLabel>
                <Select
                  value={newRule.type}
                  onChange={(e) => setNewRule({...newRule, type: e.target.value})}
                  label="Rule Type"
                >
                  {(ruleTypes[newRule.phase as keyof typeof ruleTypes] || []).map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <TextField
              label="Target Field"
              value={newRule.target}
              onChange={(e) => setNewRule({...newRule, target: e.target.value})}
              placeholder="e.g., name, manufacturer, assetTag"
              fullWidth
              required
            />
            
            <TextField
              label="Configuration (JSON)"
              value={newRule.config}
              onChange={(e) => setNewRule({...newRule, config: e.target.value})}
              placeholder={
                newRule.type === 'TRIM' ? '{"sides": "both"}' :
                newRule.type === 'TO_UPPERCASE' ? '{"fields": ["name", "manufacturer"]}' :
                newRule.type === 'REGEX_REPLACE' ? '{"pattern": "\\\\s+", "replacement": " "}' :
                '{}'
              }
              multiline
              rows={3}
              fullWidth
              helperText={
                newRule.type === 'TO_UPPERCASE' ? 'For multiple fields: {"fields": ["name", "manufacturer"]}' :
                newRule.type === 'TRIM' ? 'Options: {"sides": "both|left|right"}' :
                'Rule-specific configuration in JSON format'
              }
            />
            
            <TextField
              label="Priority"
              type="number"
              value={newRule.priority}
              onChange={(e) => setNewRule({...newRule, priority: parseInt(e.target.value) || 100})}
              helperText="Lower numbers = higher priority"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRuleEditor(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="contained" onClick={saveRule} disabled={loading}>
            {loading ? 'Saving...' : 'Save Rule'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};