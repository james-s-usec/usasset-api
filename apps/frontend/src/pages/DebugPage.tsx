import { useState, useEffect, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import type { ColDef, CellStyle, ICellRendererParams } from 'ag-grid-community';
import { Box, Typography, CircularProgress, Button, Alert, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Visibility } from '@mui/icons-material';
import { LogsApiService, type LogEntry } from '../services/logs-api';
import { DebugLogger } from '../services/debug-logger';
import { useDebug } from '../hooks/useDebugHook';
import type { DebugMessage } from '../components/DebugConsole';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

export const DebugPage = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadataDialog, setMetadataDialog] = useState<{ open: boolean; data: unknown; title: string }>({
    open: false,
    data: null,
    title: ''
  });
  
  // Use global debug context for floating console + manage database logs separately
  const { addMessage: addDebugMessage, messages: debugMessages, refreshMessages } = useDebug();

  const loadLogs = useCallback(async () => {
    try {
      addDebugMessage('info', 'Starting logs fetch', { action: 'loadLogs' });
      DebugLogger.logUIEvent('DebugPage: Starting logs fetch', { action: 'loadLogs' });
      setLoading(true);
      setError(null);
      
      const response = await LogsApiService.getLogs(1, 20);
      
      addDebugMessage('info', 'Logs loaded successfully', {
        count: response.logs.length,
        total: response.pagination.total
      });
      
      DebugLogger.logUIEvent('DebugPage: Logs fetched successfully', { 
        count: response.logs.length,
        total: response.pagination.total 
      });
      
      setLogs(response.logs);
    } catch (error) {
      const errorMessage = `Failed to load logs: ${error instanceof Error ? error.message : String(error)}`;
      
      addDebugMessage('error', 'Failed to load logs', {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      setError(errorMessage);
      DebugLogger.logError('DebugPage: Failed to load logs', error, { action: 'loadLogs' });
    } finally {
      setLoading(false);
    }
  }, [addDebugMessage]);

  useEffect(() => {
    DebugLogger.logUIEvent('DebugPage mounted');
    loadLogs();

    // Global error handler for unhandled JavaScript errors
    const handleGlobalError = (event: ErrorEvent) => {
      addDebugMessage('error', 'Global JavaScript Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      });
    };

    // Global handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      addDebugMessage('error', 'Unhandled Promise Rejection', {
        reason: event.reason instanceof Error ? event.reason.message : String(event.reason),
        stack: event.reason instanceof Error ? event.reason.stack : undefined,
        timestamp: new Date().toISOString()
      });
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [addDebugMessage, loadLogs]);

  // Metadata cell renderer component
  const MetadataCellRenderer = (params: ICellRendererParams) => {
    if (!params.value) return '';
    
    const handleViewMetadata = () => {
      setMetadataDialog({
        open: true,
        data: params.value,
        title: `Metadata for ${params.data.correlation_id}`
      });
    };

    const metadata = params.value as Record<string, unknown>;
    const preview = metadata.source ? 
      `${metadata.source} (+${Object.keys(metadata).length - 1} keys)` :
      `${Object.keys(metadata).length} keys`;

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '11px' }}>
          {preview}
        </Typography>
        <IconButton 
          size="small" 
          onClick={handleViewMetadata}
          sx={{ p: 0.25 }}
          title="View full metadata"
        >
          <Visibility fontSize="small" />
        </IconButton>
      </Box>
    );
  };

  const columnDefs: ColDef[] = [
    {
      field: 'level',
      headerName: 'Level',
      width: 80,
      cellStyle: (params): CellStyle => {
        switch (params.value) {
          case 'ERROR':
            return { color: '#d32f2f', fontWeight: 'bold' };
          case 'WARN':
            return { color: '#ed6c02', fontWeight: 'bold' };
          case 'INFO':
            return { color: '#1976d2' };
          case 'DEBUG':
            return { color: '#757575' };
          default:
            return {};
        }
      },
    },
    {
      field: 'created_at',
      headerName: 'Time',
      width: 180,
      valueFormatter: (params) => {
        return new Date(params.value).toLocaleString();
      },
    },
    {
      field: 'correlation_id',
      headerName: 'Correlation ID',
      width: 200,
      cellStyle: { fontFamily: 'monospace', fontSize: '12px' },
    },
    {
      field: 'message',
      headerName: 'Message',
      flex: 1,
      wrapText: true,
      autoHeight: true,
    },
    {
      field: 'metadata',
      headerName: 'Metadata',
      width: 220,
      cellRenderer: MetadataCellRenderer,
      cellStyle: { padding: '4px' },
    },
  ];

  const handleRefresh = async () => {
    addDebugMessage('debug', 'Refresh button clicked - refreshing both database logs and debug messages');
    DebugLogger.logUIEvent('DebugPage: Refresh button clicked');
    
    // Refresh both data sources to keep them in sync
    await Promise.all([
      loadLogs(),           // Refresh database logs table
      refreshMessages()     // Refresh debug messages (floating console)
    ]);
  };

  const handleTestUIEvent = () => {
    addDebugMessage('debug', 'Test UI Event button clicked', { userAction: 'manual_test' });
    DebugLogger.logUIEvent('DebugPage: Test button clicked', { 
      timestamp: new Date().toISOString(),
      userAction: 'manual_test' 
    });
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all logs? This cannot be undone.')) {
      return;
    }
    
    try {
      addDebugMessage('info', 'Clearing all logs from database', { action: 'clearLogs' });
      DebugLogger.logUIEvent('DebugPage: Clear logs initiated');
      
      const result = await LogsApiService.deleteLogs();
      
      addDebugMessage('info', `Successfully cleared logs: ${result.message}`, { 
        deletedCount: result.deletedCount 
      });
      
      // Refresh both data sources after clearing
      await Promise.all([
        loadLogs(),           // Refresh database logs table
        refreshMessages()     // Refresh debug messages (floating console)  
      ]);
      
      alert(`${result.message}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addDebugMessage('error', 'Failed to clear logs', { error: errorMessage });
      DebugLogger.logError('Failed to clear logs', error);
      alert(`Failed to clear logs: ${errorMessage}`);
    }
  };

  const handleCopyLogsAsJSON = () => {
    try {
      const jsonData = JSON.stringify(logs, null, 2);
      navigator.clipboard.writeText(jsonData);
      addDebugMessage('info', 'Database logs copied to clipboard', { count: logs.length });
      alert('Database logs copied to clipboard!');
    } catch (error) {
      addDebugMessage('error', 'Failed to copy database logs', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const handleCopyDebugInfo = () => {
    try {
      const debugInfo = {
        timestamp: new Date().toISOString(),
        debugMessages: debugMessages,
        databaseLogs: logs,
        userAgent: navigator.userAgent,
        url: window.location.href,
        summary: {
          totalDebugMessages: debugMessages.length,
          totalDatabaseLogs: logs.length,
          errorCount: debugMessages.filter((m: DebugMessage) => m.level === 'error').length,
          lastError: debugMessages.find((m: DebugMessage) => m.level === 'error')
        }
      };
      
      const jsonData = JSON.stringify(debugInfo, null, 2);
      navigator.clipboard.writeText(jsonData);
      addDebugMessage('info', 'Complete debug info copied to clipboard', { 
        messagesCount: debugMessages.length,
        logsCount: logs.length 
      });
      alert('Complete debug info copied to clipboard! You can paste this to share all error details.');
    } catch (error) {
      addDebugMessage('error', 'Failed to copy debug info', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading debug logs...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Database Logs ({logs.length} entries)
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Use the floating debug console (bottom-right) for real-time debug messages. This table shows persistent database logs.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button variant="contained" onClick={handleRefresh}>
          Refresh Logs
        </Button>
        <Button variant="outlined" onClick={handleTestUIEvent}>
          Test UI Event
        </Button>
        <Button variant="outlined" onClick={handleCopyLogsAsJSON}>
          Copy DB Logs
        </Button>
        <Button variant="outlined" color="secondary" onClick={handleCopyDebugInfo}>
          Copy All Debug Info
        </Button>
        <Button variant="outlined" color="warning" onClick={handleClearLogs}>
          Clear Logs
        </Button>
      </Box>
      
      <Box sx={{ height: 600, width: '100%' }}>
        <div className="ag-theme-material" style={{ height: '100%', width: '100%' }}>
          <AgGridReact
            rowData={logs}
            columnDefs={columnDefs}
            defaultColDef={{
              resizable: true,
              sortable: true,
              filter: true,
            }}
            pagination={true}
            paginationPageSize={10}
            animateRows={true}
            theme="legacy"
            onGridReady={(params) => {
              DebugLogger.logUIEvent('DebugPage: AG Grid ready', { 
                rowCount: logs.length 
              });
              params.api.sizeColumnsToFit();
            }}
            getRowStyle={(params) => {
              if (params.data.level === 'ERROR') {
                return { backgroundColor: '#ffebee' };
              }
              if (params.data.level === 'WARN') {
                return { backgroundColor: '#fff8e1' };
              }
              return undefined;
            }}
          />
        </div>
      </Box>

      {/* Metadata Dialog */}
      <Dialog
        open={metadataDialog.open}
        onClose={() => setMetadataDialog({ open: false, data: null, title: '' })}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { maxHeight: '80vh' } }}
      >
        <DialogTitle>
          {metadataDialog.title}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ 
            backgroundColor: '#f5f5f5', 
            p: 2, 
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '12px',
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {JSON.stringify(metadataDialog.data, null, 2)}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(metadataDialog.data, null, 2));
              alert('Metadata copied to clipboard!');
            }}
          >
            Copy JSON
          </Button>
          <Button 
            onClick={() => setMetadataDialog({ open: false, data: null, title: '' })}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};