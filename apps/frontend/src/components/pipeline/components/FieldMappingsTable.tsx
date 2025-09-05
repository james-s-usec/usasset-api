import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
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
  CircularProgress,
} from '@mui/material';
import { Add, Refresh } from '@mui/icons-material';
import { pipelineApi } from '../../../services/pipelineApi';

interface FieldMapping {
  csvHeader: string;
  assetField: string;
  confidence: number;
}

interface FieldMappingsTableProps {
  selectedFile: string | null;
}

// Asset fields for dropdown - extracted to constant
const ASSET_FIELDS = [
  'name', 'assetTag', 'description', 'manufacturer', 'modelNumber', 'serialNumber',
  'status', 'condition', 'category', 'type', 'buildingName', 'floorName', 'roomNumber',
  'xCoordinate', 'yCoordinate', 'area', 'squareFeet', 'installDate', 'purchaseDate',
  'purchaseCost', 'warrantyExpirationDate', 'serviceLife', 'motorHp', 'filterType',
  'filterSize', 'filterQuantity', 'beltSize', 'beltQuantity', 'vendor', 'vendorWebsite'
];

// State states - extracted for reuse
const LoadingState: React.FC = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
    <CircularProgress />
  </Box>
);

const NoFileState: React.FC = () => (
  <Alert severity="info" sx={{ m: 2 }}>
    Select a file in the Extract phase to view field mappings
  </Alert>
);

const ErrorState: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
  <Alert 
    severity="error" 
    sx={{ m: 2 }}
    action={
      <Button color="inherit" size="small" onClick={onRetry}>
        Retry
      </Button>
    }
  >
    {error}
  </Alert>
);

// Dialog form fields
const CsvHeaderField: React.FC<{
  csvAlias: string;
  setCsvAlias: (value: string) => void;
  csvHeader?: string;
}> = ({ csvAlias, setCsvAlias, csvHeader }) => (
  <TextField
    fullWidth
    label="CSV Header"
    value={csvAlias}
    onChange={(e): void => setCsvAlias(e.target.value)}
    margin="normal"
    disabled={Boolean(csvHeader)}
  />
);

const AssetFieldSelect: React.FC<{
  assetField: string;
  setAssetField: (value: string) => void;
}> = ({ assetField, setAssetField }) => (
  <FormControl 
    fullWidth 
    margin="normal"
  >
    <InputLabel>Asset Field</InputLabel>
    <Select
      value={assetField}
      onChange={(e): void => setAssetField(e.target.value)}
      label="Asset Field"
    >
      {ASSET_FIELDS.map((field) => (
        <MenuItem key={field} value={field}>
          {field}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

const ConfidenceField: React.FC<{
  confidence: number;
  setConfidence: (value: number) => void;
}> = ({ confidence, setConfidence }) => (
  <TextField
    fullWidth
    label="Confidence"
    type="number"
    value={confidence}
    onChange={(e): void => setConfidence(Number(e.target.value))}
    margin="normal"
    inputProps={{ min: 0, max: 1, step: 0.1 }}
    helperText="0.0 = Low confidence, 1.0 = High confidence"
  />
);

// Form content component
const DialogFormContent: React.FC<{
  error: string | null;
  csvAlias: string;
  setCsvAlias: (value: string) => void;
  csvHeader?: string;
  assetField: string;
  setAssetField: (value: string) => void;
  confidence: number;
  setConfidence: (value: number) => void;
}> = ({ 
  error, 
  csvAlias, 
  setCsvAlias, 
  csvHeader, 
  assetField, 
  setAssetField, 
  confidence, 
  setConfidence 
}) => (
  <Box sx={{ pt: 1 }}>
    {error && (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    )}
    
    <CsvHeaderField 
      csvAlias={csvAlias} 
      setCsvAlias={setCsvAlias} 
      csvHeader={csvHeader} 
    />
    
    <AssetFieldSelect 
      assetField={assetField} 
      setAssetField={setAssetField} 
    />
    
    <ConfidenceField 
      confidence={confidence} 
      setConfidence={setConfidence} 
    />
  </Box>
);

// Dialog component
const CreateAliasDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  csvHeader?: string;
  onSuccess: () => void;
}> = ({ open, onClose, csvHeader, onSuccess }) => {
  const [assetField, setAssetField] = useState('');
  const [csvAlias, setCsvAlias] = useState(csvHeader || '');
  const [confidence, setConfidence] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (csvHeader) {
      setCsvAlias(csvHeader);
    }
  }, [csvHeader]);

  const handleSubmit = async (): Promise<void> => {
    if (!assetField || !csvAlias) return;

    setLoading(true);
    setError(null);

    try {
      await pipelineApi.createAlias({
        assetField,
        csvAlias,
        confidence
      });
      onSuccess();
      onClose();
      setAssetField('');
      setCsvAlias('');
      setConfidence(1.0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create alias');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
    >
      <DialogTitle>Create Field Mapping</DialogTitle>
      <DialogContent>
        <DialogFormContent
          error={error}
          csvAlias={csvAlias}
          setCsvAlias={setCsvAlias}
          csvHeader={csvHeader}
          assetField={assetField}
          setAssetField={setAssetField}
          confidence={confidence}
          setConfidence={setConfidence}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!assetField || !csvAlias || loading}
        >
          {loading ? <CircularProgress size={20} /> : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Table components
const MappedFieldsTable: React.FC<{
  mappedFields: FieldMapping[];
}> = ({ mappedFields }) => (
  <TableContainer component={Paper}>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>CSV Header</TableCell>
          <TableCell>Asset Field</TableCell>
          <TableCell>Confidence</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {mappedFields.map((field, index) => (
          <TableRow key={index}>
            <TableCell>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {field.csvHeader}
              </Typography>
            </TableCell>
            <TableCell>{field.assetField}</TableCell>
            <TableCell>
              <Chip
                label={`${(field.confidence * 100).toFixed(0)}%`}
                size="small"
                color={field.confidence >= 0.9 ? 'success' : field.confidence >= 0.7 ? 'warning' : 'default'}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

const UnmappedFieldsTable: React.FC<{
  unmappedFields: string[];
  onCreateMapping: (csvHeader: string) => void;
}> = ({ unmappedFields, onCreateMapping }) => (
  <TableContainer component={Paper}>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>CSV Header</TableCell>
          <TableCell width={100}>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {unmappedFields.map((field, index) => (
          <TableRow key={index}>
            <TableCell>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {field}
              </Typography>
            </TableCell>
            <TableCell>
              <IconButton
                size="small"
                onClick={(): void => onCreateMapping(field)}
                color="primary"
              >
                <Add />
              </IconButton>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

// Section components
const MappedFieldsSection: React.FC<{
  mappedFields: FieldMapping[];
}> = ({ mappedFields }) => (
  <>
    <Typography variant="h6" sx={{ mb: 2, color: 'success.main' }}>
      Mapped Fields ({mappedFields.length})
    </Typography>
    <MappedFieldsTable mappedFields={mappedFields} />
  </>
);

const UnmappedFieldsSection: React.FC<{
  unmappedFields: string[];
  onCreateMapping: (csvHeader: string) => void;
}> = ({ unmappedFields, onCreateMapping }) => (
  <>
    <Typography variant="h6" sx={{ mb: 2, color: 'warning.main', mt: 3 }}>
      Unmapped Fields ({unmappedFields.length})
    </Typography>
    <UnmappedFieldsTable 
      unmappedFields={unmappedFields}
      onCreateMapping={onCreateMapping}
    />
  </>
);

// Header components
const CoverageIndicator: React.FC<{
  coveragePercentage: number;
}> = ({ coveragePercentage }) => (
  <Box sx={{ mb: 3 }}>
    <Chip
      label={`${coveragePercentage}% Field Coverage`}
      color={coveragePercentage >= 90 ? 'success' : coveragePercentage >= 70 ? 'warning' : 'error'}
      sx={{ mr: 2 }}
    />
    {coveragePercentage === 100 && (
      <Chip label="🎉 Complete Coverage!" color="success" variant="outlined" />
    )}
  </Box>
);

const HeaderActions: React.FC<{
  mappedFields: FieldMapping[];
  totalCsvColumns: number;
  coveragePercentage: number;
  onRefresh: () => void;
  onAddMapping: () => void;
}> = ({ mappedFields, totalCsvColumns, coveragePercentage, onRefresh, onAddMapping }) => (
  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
    <Typography variant="body2" color="text.secondary">
      Coverage: {mappedFields.length}/{totalCsvColumns} ({coveragePercentage}%)
    </Typography>
    <IconButton onClick={onRefresh}>
      <Refresh />
    </IconButton>
    <Button
      variant="outlined"
      startIcon={<Add />}
      onClick={onAddMapping}
    >
      Add Mapping
    </Button>
  </Box>
);

const FieldMappingsHeader: React.FC<{
  coveragePercentage: number;
  mappedFields: FieldMapping[];
  totalCsvColumns: number;
  onRefresh: () => void;
  onAddMapping: () => void;
}> = ({ coveragePercentage, mappedFields, totalCsvColumns, onRefresh, onAddMapping }) => (
  <>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Typography variant="h5">Field Mappings</Typography>
      <HeaderActions
        mappedFields={mappedFields}
        totalCsvColumns={totalCsvColumns}
        coveragePercentage={coveragePercentage}
        onRefresh={onRefresh}
        onAddMapping={onAddMapping}
      />
    </Box>
    <CoverageIndicator coveragePercentage={coveragePercentage} />
  </>
);

// Main component
export const FieldMappingsTable: React.FC<FieldMappingsTableProps> = ({ selectedFile }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mappedFields, setMappedFields] = useState<FieldMapping[]>([]);
  const [unmappedFields, setUnmappedFields] = useState<string[]>([]);
  const [totalCsvColumns, setTotalCsvColumns] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCsvHeader, setSelectedCsvHeader] = useState<string>('');

  const loadFieldMappings = useCallback(async (): Promise<void> => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    try {
      const data = await pipelineApi.getFieldMappings(selectedFile);
      setMappedFields(data.mappedFields);
      setUnmappedFields(data.unmappedFields);
      setTotalCsvColumns(data.totalCsvColumns);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load field mappings');
    } finally {
      setLoading(false);
    }
  }, [selectedFile]);

  useEffect(() => {
    loadFieldMappings();
  }, [loadFieldMappings]);

  const handleCreateMapping = (csvHeader: string): void => {
    setSelectedCsvHeader(csvHeader);
    setCreateDialogOpen(true);
  };

  const handleCloseDialog = (): void => {
    setCreateDialogOpen(false);
    setSelectedCsvHeader('');
  };

  const coveragePercentage = totalCsvColumns > 0 
    ? Math.round((mappedFields.length / totalCsvColumns) * 100) 
    : 0;

  if (!selectedFile) return <NoFileState />;
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={loadFieldMappings} />;

  return (
    <Box sx={{ p: 2 }}>
      <FieldMappingsHeader 
        coveragePercentage={coveragePercentage}
        mappedFields={mappedFields}
        totalCsvColumns={totalCsvColumns}
        onRefresh={loadFieldMappings}
        onAddMapping={(): void => setCreateDialogOpen(true)}
      />

      <MappedFieldsSection mappedFields={mappedFields} />
      
      {unmappedFields.length > 0 && (
        <UnmappedFieldsSection 
          unmappedFields={unmappedFields}
          onCreateMapping={handleCreateMapping}
        />
      )}

      <CreateAliasDialog
        open={createDialogOpen}
        onClose={handleCloseDialog}
        csvHeader={selectedCsvHeader}
        onSuccess={loadFieldMappings}
      />
    </Box>
  );
};