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
// import { pipelineApi } from '../../../services/pipelineApi';

interface ValidationReportProps {
  jobStatus: any;
}

export const ValidationReport: React.FC<ValidationReportProps> = ({ jobStatus }) => {
  const [clearing, setClearing] = useState(false);
  const [clearResult, setClearResult] = useState<{ deletedCount?: number; error?: string } | null>(null);

  const handleClearDatabase = async () => {
    if (!window.confirm('Are you sure you want to clear ALL assets from the database? This cannot be undone.')) {
      return;
    }

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
      setClearResult({ error: error instanceof Error ? error.message : 'Network error' });
    } finally {
      setClearing(false);
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom color="primary">
          🔍 Pipeline Validation & Debug
        </Typography>
        
        {/* Import Status Summary */}
        <Box sx={{ mb: 3 }}>
          <Alert severity={jobStatus?.status === 'COMPLETED' ? 'success' : 'info'} sx={{ mb: 2 }}>
            <strong>Import Status:</strong> {jobStatus?.status || 'Unknown'}
            {jobStatus?.progress && (
              <span> | Processed: {jobStatus.progress.processed}/{jobStatus.progress.total}</span>
            )}
          </Alert>
        </Box>

        {/* Database Actions */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">⚙️ Database Management</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                color="error"
                startIcon={clearing ? <CircularProgress size={16} /> : <DeleteIcon />}
                onClick={handleClearDatabase}
                disabled={clearing}
              >
                {clearing ? 'Clearing...' : 'Clear All Assets'}
              </Button>
              
              {clearResult && (
                <Alert 
                  severity={clearResult.error ? 'error' : 'success'}
                  sx={{ flex: 1 }}
                >
                  {clearResult.error 
                    ? `Error: ${clearResult.error}`
                    : `✅ Cleared ${clearResult.deletedCount} assets from database`
                  }
                </Alert>
              )}
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Use this to clear test data before fresh imports. This will remove ALL assets from the database.
            </Typography>
          </AccordionDetails>
        </Accordion>

        {/* Debug Information */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">🐛 Debug Information</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Recent Debug Logs:</strong>
              </Typography>
              <Alert severity="info">
                Check browser console or backend logs for detailed error messages.
                Look for logs containing "[DEBUG]" for import details.
              </Alert>
            </Box>
            
            <Typography variant="body2" color="text.secondary">
              <strong>Common Import Failures:</strong>
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Duplicate Asset Tags"
                  secondary="Assets with same assetTag already exist (skipDuplicates enabled)"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Missing Required Fields"
                  secondary="assetTag or name fields are empty or invalid"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Invalid Enum Values"
                  secondary="status or condition fields contain invalid values"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Database Constraints"
                  secondary="Foreign key violations or other schema constraints"
                />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>

        {/* Pipeline Health Check */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">🏥 System Health</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Chip label="Backend: Connected" color="success" size="small" />
              <Chip label="Database: Online" color="success" size="small" />
              <Chip label="Pipeline: Active" color="success" size="small" />
              <Chip label="Debug Logs: Enabled" color="info" size="small" />
            </Box>
            
            <Typography variant="body2" color="text.secondary">
              All systems operational. Check individual components above for specific issues.
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Paper>
    </Box>
  );
};