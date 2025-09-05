import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert
} from '@mui/material';
import type { RulesTestResult } from './types';

interface TestResultsProps {
  testResult: RulesTestResult;
}

const ResultAlert: React.FC<{ testResult: RulesTestResult }> = ({ testResult }) => (
  <Alert severity={testResult.success ? "success" : "error"}>
    <Typography variant="subtitle2">
      Rule Test Results:
    </Typography>
    <Typography variant="body2">
      Applied {testResult.rulesApplied.length} rules
    </Typography>
    {testResult.processing.errors.length > 0 && (
      <Typography variant="body2" color="error">
        Errors: {testResult.processing.errors.join(', ')}
      </Typography>
    )}
  </Alert>
);

const DataPanel: React.FC<{ title: string; data: unknown }> = ({ title, data }) => (
  <Paper sx={{ p: 2 }}>
    <Typography variant="subtitle2" gutterBottom>
      {title}:
    </Typography>
    <pre style={{ fontSize: '12px', overflow: 'auto', maxHeight: '200px' }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  </Paper>
);

const DataComparison: React.FC<{ testResult: RulesTestResult }> = ({ testResult }) => (
  <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
    <DataPanel title="Before" data={testResult.testData.before} />
    <DataPanel title="After" data={testResult.testData.after} />
  </Box>
);

export const TestResults: React.FC<TestResultsProps> = ({ testResult }) => (
  <Box sx={{ m: 2 }}>
    <ResultAlert testResult={testResult} />
    <DataComparison testResult={testResult} />
  </Box>
);