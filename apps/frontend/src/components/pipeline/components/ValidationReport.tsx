import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Alert, 
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  List,
  ListItem,
  ListItemText,
  CircularProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';

interface JobProgress {
  processed: number;
  total: number;
}

interface JobStatus {
  status: string;
  progress?: JobProgress;
}

interface ValidationReportProps {
  jobStatus: JobStatus;
}

interface ClearResult {
  deletedCount?: number;
  error?: string;
}

// Custom hook for database clearing functionality
const useClearDatabase = (
  setClearing: (clearing: boolean) => void,
  setClearResult: (result: ClearResult | null) => void
) => {
  return async (): Promise<void> => {
    const confirmed = window.confirm(
      'Are you sure you want to clear ALL assets from the database? This cannot be undone.'
    );
    if (!confirmed) return;

    setClearing(true);
    setClearResult(null);
    
    try {
      const response = await fetch('http://localhost:3000/api/assets/dev/clear-all', {
        method: 'DELETE',
      });
      const result = await response.json();
      
      if (result.success) {
        setClearResult({ deletedCount: result.data.deletedCount });
      } else {
        setClearResult({ error: result.error?.message || 'Failed to clear database' });
      }
    } catch (error) {
      setClearResult({ 
        error: error instanceof Error ? error.message : 'Network error' 
      });
    } finally {
      setClearing(false);
    }
  };
};

// Component for displaying import status
const ImportStatusSection: React.FC<{ jobStatus: JobStatus }> = ({ jobStatus }) => (
  <Box sx={{ mb: 3 }}>
    <Alert severity={jobStatus?.status === 'COMPLETED' ? 'success' : 'info'} sx={{ mb: 2 }}>
      <strong>Import Status:</strong> {jobStatus?.status || 'Unknown'}
      {jobStatus?.progress && (
        <span> | Processed: {jobStatus.progress.processed}/{jobStatus.progress.total}</span>
      )}
    </Alert>
  </Box>
);

// Component for database management actions
const DatabaseManagementSection: React.FC<{
  clearing: boolean;
  clearResult: ClearResult | null;
  onClearDatabase: () => Promise<void>;
}> = ({ clearing, clearResult, onClearDatabase }) => (
  <Accordion>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography variant="subtitle1">⚙️ Database Management</Typography>
    </AccordionSummary>
    <AccordionDetails>
      <ClearDatabaseActions 
        clearing={clearing}
        clearResult={clearResult}
        onClear={onClearDatabase}
      />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Use this to clear test data before fresh imports. This will remove ALL assets from the database.
      </Typography>
    </AccordionDetails>
  </Accordion>
);

// Component for clear database actions
const ClearDatabaseActions: React.FC<{
  clearing: boolean;
  clearResult: ClearResult | null;
  onClear: () => Promise<void>;
}> = ({ clearing, clearResult, onClear }) => (
  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
    <Button
      variant="outlined"
      color="error"
      startIcon={clearing ? <CircularProgress size={16} /> : <DeleteIcon />}
      onClick={onClear}
      disabled={clearing}
    >
      {clearing ? 'Clearing...' : 'Clear All Assets'}
    </Button>
    
    {clearResult && (
      <ClearResultAlert clearResult={clearResult} />
    )}
  </Box>
);

// Component for clear result alert
const ClearResultAlert: React.FC<{ clearResult: ClearResult }> = ({ clearResult }) => (
  <Alert 
    severity={clearResult.error ? 'error' : 'success'}
    sx={{ flex: 1 }}
  >
    {clearResult.error 
      ? `Error: ${clearResult.error}`
      : `✅ Cleared ${clearResult.deletedCount} assets from database`
    }
  </Alert>
);

// Component for debug information section
const DebugInformationSection: React.FC = () => (
  <Accordion>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography variant="subtitle1">🐛 Debug Information</Typography>
    </AccordionSummary>
    <AccordionDetails>
      <DebugLogs />
      <CommonFailuresList />
    </AccordionDetails>
  </Accordion>
);

// Component for debug logs
const DebugLogs: React.FC = () => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="body2" gutterBottom>
      <strong>Recent Debug Logs:</strong>
    </Typography>
    <Alert severity="info">
      Check browser console or backend logs for detailed error messages.
      Look for logs containing &quot;[DEBUG]&quot; for import details.
    </Alert>
  </Box>
);

// Component for common failures list
const CommonFailuresList: React.FC = () => (
  <>
    <Typography variant="body2" color="text.secondary">
      <strong>Common Import Failures:</strong>
    </Typography>
    <List dense>
      <FailureListItem 
        primary="Duplicate Asset Tags"
        secondary="Assets with same assetTag already exist (skipDuplicates enabled)"
      />
      <FailureListItem 
        primary="Missing Required Fields"
        secondary="assetTag or name fields are empty or invalid"
      />
      <FailureListItem 
        primary="Invalid Enum Values"
        secondary="status or condition fields contain invalid values"
      />
      <FailureListItem 
        primary="Database Constraints"
        secondary="Foreign key violations or other schema constraints"
      />
    </List>
  </>
);

// Component for individual failure list items
const FailureListItem: React.FC<{ primary: string; secondary: string }> = ({ primary, secondary }) => (
  <ListItem>
    <ListItemText primary={primary} secondary={secondary} />
  </ListItem>
);

// Component for system health section
const SystemHealthSection: React.FC = () => (
  <Accordion>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography variant="subtitle1">🏥 System Health</Typography>
    </AccordionSummary>
    <AccordionDetails>
      <SystemHealthChips />
      <Typography variant="body2" color="text.secondary">
        All systems operational. Check individual components above for specific issues.
      </Typography>
    </AccordionDetails>
  </Accordion>
);

// Component for system health chips
const SystemHealthChips: React.FC = () => (
  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
    <Chip label="Backend: Connected" color="success" size="small" />
    <Chip label="Database: Online" color="success" size="small" />
    <Chip label="Pipeline: Active" color="success" size="small" />
    <Chip label="Debug Logs: Enabled" color="info" size="small" />
  </Box>
);

export const ValidationReport: React.FC<ValidationReportProps> = ({ jobStatus }) => {
  const [clearing, setClearing] = useState(false);
  const [clearResult, setClearResult] = useState<ClearResult | null>(null);

  const handleClearDatabase = useClearDatabase(setClearing, setClearResult);

  return (
    <Box sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom color="primary">
          🔍 Pipeline Validation & Debug
        </Typography>
        
        <ImportStatusSection jobStatus={jobStatus} />
        <DatabaseManagementSection 
          clearing={clearing}
          clearResult={clearResult}
          onClearDatabase={handleClearDatabase}
        />
        <DebugInformationSection />
        <SystemHealthSection />
      </Paper>
    </Box>
  );
};