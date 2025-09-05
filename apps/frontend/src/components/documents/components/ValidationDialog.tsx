import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Box,
  LinearProgress,
  CircularProgress,
  Button,
  Typography,
} from '@mui/material';

interface ValidationResult {
  totalPages: number;
  validPages: number[];
  invalidPages: Array<{ page: number; error: string }>;
}

interface ValidationDialogProps {
  open: boolean;
  onClose: () => void;
  onCancel: () => void;
  isValidating: boolean;
  validatingFile: string;
  validationResult: ValidationResult | null;
  validationProgress: { current: number; total: number };
}

const ValidationProgressContent: React.FC<{
  validationProgress: { current: number; total: number };
}> = ({ validationProgress }) => (
  <Box>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <CircularProgress size={24} sx={{ mr: 2 }} />
      <Typography>
        Validating pages... This may take 10-30 seconds for complex PDFs.
      </Typography>
    </Box>
    <LinearProgress 
      variant="indeterminate" 
      sx={{ mb: 2, height: 8, borderRadius: 4 }}
    />
    <Typography variant="body2" color="text.secondary" align="center">
      Testing {validationProgress.total} pages for rendering errors
    </Typography>
  </Box>
);

const ValidPagesSection: React.FC<{ validPages: number[] }> = ({ validPages }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="h6" color="success.main" sx={{ mb: 1 }}>
      ✅ Valid Pages ({validPages.length})
    </Typography>
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {validPages.map(page => (
        <Chip 
          key={page} 
          label={`Page ${page}`} 
          color="success" 
          size="small" 
        />
      ))}
    </Box>
  </Box>
);

const InvalidPagesSection: React.FC<{ 
  invalidPages: Array<{ page: number; error: string }> 
}> = ({ invalidPages }) => (
  <Box>
    <Typography variant="h6" color="error.main" sx={{ mb: 1 }}>
      ❌ Pages with Errors ({invalidPages.length})
    </Typography>
    {invalidPages.map(({ page, error }) => (
      <Alert key={page} severity="error" sx={{ mb: 1 }}>
        <strong>Page {page}:</strong> {error}
      </Alert>
    ))}
  </Box>
);

const ValidationResultContent: React.FC<{
  validationResult: ValidationResult;
}> = ({ validationResult }) => (
  <Box>
    <Alert severity="info" sx={{ mb: 2 }}>
      Total Pages: {validationResult.totalPages}
    </Alert>
    
    {validationResult.validPages.length > 0 && (
      <ValidPagesSection validPages={validationResult.validPages} />
    )}
    
    {validationResult.invalidPages.length > 0 && (
      <InvalidPagesSection invalidPages={validationResult.invalidPages} />
    )}
  </Box>
);

const ValidationDialogTitle: React.FC<{ isValidating: boolean; validatingFile: string }> = ({ isValidating, validatingFile }) => (
  <DialogTitle>
    {isValidating ? `Validating: ${validatingFile}` : `PDF Validation Results: ${validatingFile}`}
  </DialogTitle>
);

const ValidationDialogContent: React.FC<{
  isValidating: boolean;
  validationResult: ValidationResult | null;
  validationProgress: { current: number; total: number };
}> = ({ isValidating, validationResult, validationProgress }) => (
  <DialogContent>
    {isValidating ? (
      <ValidationProgressContent validationProgress={validationProgress} />
    ) : validationResult ? (
      <ValidationResultContent validationResult={validationResult} />
    ) : null}
  </DialogContent>
);

const ValidationDialogActions: React.FC<{ isValidating: boolean; onCancel: () => void }> = ({ isValidating, onCancel }) => (
  isValidating ? (
    <DialogActions>
      <Button onClick={onCancel} color="error" variant="outlined">
        Cancel Validation
      </Button>
    </DialogActions>
  ) : null
);

export const ValidationDialog: React.FC<ValidationDialogProps> = ({
  open,
  onClose,
  onCancel,
  isValidating,
  validatingFile,
  validationResult,
  validationProgress
}) => (
  <Dialog 
    open={open} 
    onClose={!isValidating ? onClose : undefined} 
    maxWidth="sm" 
    fullWidth
  >
    <ValidationDialogTitle isValidating={isValidating} validatingFile={validatingFile} />
    <ValidationDialogContent 
      isValidating={isValidating}
      validationResult={validationResult}
      validationProgress={validationProgress}
    />
    <ValidationDialogActions isValidating={isValidating} onCancel={onCancel} />
  </Dialog>
);

export type { ValidationResult };