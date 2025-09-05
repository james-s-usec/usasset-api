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

// Complete asset fields from SafeAssetDto - all 125+ fields available for mapping
const ASSET_FIELDS = [
  'actualPowerKw',
  'amperage',
  'annualCarbonEmissions',
  'annualGasConsumption',
  'annualMaintenanceCost',
  'annualOperatingDays',
  'area',
  'assetCategory',
  'assetCategoryName',
  'assetLocation',
  'assetSizeRounded',
  'assetTag',
  'assetType',
  'beltQuantity',
  'beltSize',
  'btuRating',
  'buildingName',
  'catalogItemId',
  'catalogName',
  'classId',
  'condition',
  'created_at',
  'currentBookValue',
  'customerName',
  'dailyOperatingHours',
  'depreciationMethod',
  'description',
  'disposalCost',
  'drawingAbbreviation',
  'energyEfficiencyRating',
  'energyEfficiencyValue',
  'equipNameId',
  'equipServedBy',
  'equipmentSize',
  'estimatedAnnualElectricityCost',
  'estimatedAnnualGasCost',
  'estimatedAnnualKwh',
  'estimatedAnnualOperatingCost',
  'estimatedOperatingHours',
  'estimatedReplacementDate',
  'expectedLifetime',
  'filterQuantity',
  'filterSize',
  'filterType',
  'floor',
  'floorName',
  'gasConsumptionRate',
  'id',
  'idUnit',
  'industryServiceLife',
  'installDate',
  'installationCost',
  'legacyBranchId',
  'legacyClientSiteEquipmentName',
  'legacyClientSiteEquipmentRn',
  'legacyInternalAssetId',
  'legacyUsAssetId',
  'legacyUseAssetId',
  'loadFactor',
  'location',
  'manufactureDate',
  'manufacturer',
  'modelNumber',
  'motorHp',
  'name',
  'note1',
  'note1Subject',
  'note2',
  'note2Subject',
  'note3',
  'note3Subject',
  'note4',
  'note4Subject',
  'note5',
  'note5Subject',
  'note6',
  'note6Subject',
  'notes',
  'numberOfCircuits',
  'observedRemainingLife',
  'operationsSystem',
  'ownerId',
  'peakDemandKw',
  'phase',
  'powerFactor',
  'preconSystem',
  'preconTag',
  'projectId',
  'propertyName',
  'propertyZoneServed',
  'purchaseCost',
  'quantity',
  'ratedPowerKw',
  'ratingName',
  'ratingValue',
  'refrigerant',
  'refrigerantDefaultDescription',
  'refrigerantDescription',
  'refrigerantQuantity',
  'returnFanMotorSize',
  'roomNumber',
  'salvageValue',
  'serialNumber',
  'serviceId',
  'serviceLife',
  'size',
  'squareFeet',
  'status',
  'subSystemClass',
  'subSystemClassification',
  'subSystemId',
  'subSystemType',
  'supplyFanMotorSize',
  'systemCategory',
  'systemTypeId',
  'title',
  'totalAnnualEnergyCost',
  'totalCostOfOwnership',
  'trade',
  'type',
  'unit',
  'updated_at',
  'vendor',
  'vendorWebsite',
  'verified',
  'voltage',
  'warrantyExpirationDate',
  'weight',
  'xCoordinate',
  'yCoordinate'
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
const DialogErrorAlert: React.FC<{ error: string | null }> = ({ error }) => {
  if (!error) return null;
  return (
    <Alert severity="error" sx={{ mb: 2 }}>
      {error}
    </Alert>
  );
};

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
    <DialogErrorAlert error={error} />
    
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
interface CreateAliasDialogState {
  assetField: string; 
  setAssetField: (value: string) => void;
  csvAlias: string; 
  setCsvAlias: (value: string) => void;
  confidence: number; 
  setConfidence: (value: number) => void;
  loading: boolean; 
  setLoading: (value: boolean) => void;
  error: string | null; 
  setError: (value: string | null) => void;
  resetForm: () => void;
}

const useCreateAliasDialogState = (csvHeader?: string): CreateAliasDialogState => {
  const [assetField, setAssetField] = useState('');
  const [csvAlias, setCsvAlias] = useState(csvHeader || '');
  const [confidence, setConfidence] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = (): void => {
    setAssetField('');
    setCsvAlias('');
    setConfidence(1.0);
    setError(null);
  };

  return {
    assetField, setAssetField,
    csvAlias, setCsvAlias,
    confidence, setConfidence,
    loading, setLoading,
    error, setError,
    resetForm
  };
};

const useCreateAliasDialog = (csvHeader?: string): CreateAliasDialogState => {
  const state = useCreateAliasDialogState(csvHeader);

  useEffect(() => {
    if (csvHeader) {
      state.setCsvAlias(csvHeader);
    }
  }, [csvHeader, state]);

  return state;
};

const performAliasCreation = async (
  assetField: string,
  csvAlias: string,
  confidence: number
): Promise<void> => {
  await pipelineApi.createAlias({
    assetField,
    csvAlias,
    confidence
  });
};

const useCreateAliasSubmit = (params: {
  assetField: string;
  csvAlias: string;
  confidence: number;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetForm: () => void;
  onSuccess: () => void;
  onClose: () => void;
}): (() => Promise<void>) => {
  const { assetField, csvAlias, confidence, setLoading, setError, resetForm, onSuccess, onClose } = params;
  
  return useCallback(async (): Promise<void> => {
    if (!assetField || !csvAlias) return;

    setLoading(true);
    setError(null);

    try {
      await performAliasCreation(assetField, csvAlias, confidence);
      onSuccess();
      onClose();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create alias');
    } finally {
      setLoading(false);
    }
  }, [assetField, csvAlias, confidence, setLoading, setError, resetForm, onSuccess, onClose]);
};

const CreateAliasDialogActions: React.FC<{
  onClose: () => void;
  handleSubmit: () => Promise<void>;
  assetField: string;
  csvAlias: string;
  loading: boolean;
}> = ({ onClose, handleSubmit, assetField, csvAlias, loading }) => (
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
);

interface CreateAliasDialogLayoutProps {
  open: boolean;
  onClose: () => void;
  csvHeader?: string;
  error: string | null;
  csvAlias: string;
  setCsvAlias: (value: string) => void;
  assetField: string;
  setAssetField: (value: string) => void;
  confidence: number;
  setConfidence: (value: number) => void;
  handleSubmit: () => Promise<void>;
  loading: boolean;
}

const CreateAliasDialogLayout: React.FC<CreateAliasDialogLayoutProps> = (props) => (
  <Dialog 
    open={props.open} 
    onClose={props.onClose} 
    maxWidth="sm" 
    fullWidth
  >
    <DialogTitle>Create Field Mapping</DialogTitle>
    <DialogContent>
      <DialogFormContent
        error={props.error}
        csvAlias={props.csvAlias}
        setCsvAlias={props.setCsvAlias}
        csvHeader={props.csvHeader}
        assetField={props.assetField}
        setAssetField={props.setAssetField}
        confidence={props.confidence}
        setConfidence={props.setConfidence}
      />
    </DialogContent>
    <CreateAliasDialogActions
      onClose={props.onClose}
      handleSubmit={props.handleSubmit}
      assetField={props.assetField}
      csvAlias={props.csvAlias}
      loading={props.loading}
    />
  </Dialog>
);

interface CreateAliasDialogProps {
  open: boolean;
  onClose: () => void;
  csvHeader?: string;
  onSuccess: () => void;
}

const CreateAliasDialog: React.FC<CreateAliasDialogProps> = (props) => {
  const { open, onClose, csvHeader, onSuccess } = props;
  const state = useCreateAliasDialog(csvHeader);
  
  const handleSubmit = useCreateAliasSubmit({
    assetField: state.assetField, 
    csvAlias: state.csvAlias, 
    confidence: state.confidence,
    setLoading: state.setLoading, 
    setError: state.setError, 
    resetForm: state.resetForm,
    onSuccess, 
    onClose
  });

  return (
    <CreateAliasDialogLayout
      open={open}
      onClose={onClose}
      csvHeader={csvHeader}
      error={state.error}
      csvAlias={state.csvAlias}
      setCsvAlias={state.setCsvAlias}
      assetField={state.assetField}
      setAssetField={state.setAssetField}
      confidence={state.confidence}
      setConfidence={state.setConfidence}
      handleSubmit={handleSubmit}
      loading={state.loading}
    />
  );
};

// Table components
const MappedFieldTableRow: React.FC<{ field: FieldMapping; index: number }> = ({ field, index }) => (
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
);

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
          <MappedFieldTableRow key={index} field={field} index={index} />
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

const UnmappedFieldTableRow: React.FC<{ 
  field: string; 
  index: number;
  onCreateMapping: (csvHeader: string) => void;
}> = ({ field, index, onCreateMapping }) => (
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
          <UnmappedFieldTableRow 
            key={index} 
            field={field} 
            index={index}
            onCreateMapping={onCreateMapping}
          />
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
interface FieldMappingsTableData {
  loading: boolean;
  error: string | null;
  mappedFields: FieldMapping[];
  unmappedFields: string[];
  totalCsvColumns: number;
  coveragePercentage: number;
  loadFieldMappings: () => Promise<void>;
}

const useFieldMappingsLoader = (params: {
  selectedFile: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setMappedFields: (fields: FieldMapping[]) => void;
  setUnmappedFields: (fields: string[]) => void;
  setTotalCsvColumns: (count: number) => void;
}): (() => Promise<void>) => {
  const { selectedFile, setLoading, setError, setMappedFields, setUnmappedFields, setTotalCsvColumns } = params;
  
  return useCallback(async (): Promise<void> => {
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
  }, [selectedFile, setLoading, setError, setMappedFields, setUnmappedFields, setTotalCsvColumns]);
};

const useFieldMappingsTable = (selectedFile: string | null): FieldMappingsTableData => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mappedFields, setMappedFields] = useState<FieldMapping[]>([]);
  const [unmappedFields, setUnmappedFields] = useState<string[]>([]);
  const [totalCsvColumns, setTotalCsvColumns] = useState(0);

  const loadFieldMappings = useFieldMappingsLoader({
    selectedFile, setLoading, setError, setMappedFields, setUnmappedFields, setTotalCsvColumns
  });

  useEffect(() => {
    loadFieldMappings();
  }, [loadFieldMappings]);

  const coveragePercentage = totalCsvColumns > 0 
    ? Math.round((mappedFields.length / totalCsvColumns) * 100) 
    : 0;

  return {
    loading,
    error,
    mappedFields,
    unmappedFields,
    totalCsvColumns,
    coveragePercentage,
    loadFieldMappings
  };
};

const FieldMappingsContent: React.FC<{
  mappedFields: FieldMapping[];
  unmappedFields: string[];
  totalCsvColumns: number;
  coveragePercentage: number;
  onRefresh: () => void;
  onCreateMapping: (csvHeader: string) => void;
}> = ({ mappedFields, unmappedFields, totalCsvColumns, coveragePercentage, onRefresh, onCreateMapping }) => (
  <>
    <FieldMappingsHeader 
      coveragePercentage={coveragePercentage}
      mappedFields={mappedFields}
      totalCsvColumns={totalCsvColumns}
      onRefresh={onRefresh}
      onAddMapping={(): void => {}}
    />

    <MappedFieldsSection mappedFields={mappedFields} />
    
    {unmappedFields.length > 0 && (
      <UnmappedFieldsSection 
        unmappedFields={unmappedFields}
        onCreateMapping={onCreateMapping}
      />
    )}
  </>
);

const FieldMappingsTableLayout: React.FC<{
  mappedFields: FieldMapping[];
  unmappedFields: string[];
  totalCsvColumns: number;
  coveragePercentage: number;
  loadFieldMappings: () => void;
  handleCreateMapping: (csvHeader: string) => void;
  createDialogOpen: boolean;
  handleCloseDialog: () => void;
  selectedCsvHeader: string;
}> = ({ 
  mappedFields, unmappedFields, totalCsvColumns, coveragePercentage,
  loadFieldMappings, handleCreateMapping, createDialogOpen, 
  handleCloseDialog, selectedCsvHeader 
}) => (
  <Box sx={{ p: 2 }}>
    <FieldMappingsContent
      mappedFields={mappedFields}
      unmappedFields={unmappedFields}
      totalCsvColumns={totalCsvColumns}
      coveragePercentage={coveragePercentage}
      onRefresh={loadFieldMappings}
      onCreateMapping={handleCreateMapping}
    />

    <CreateAliasDialog
      open={createDialogOpen}
      onClose={handleCloseDialog}
      csvHeader={selectedCsvHeader}
      onSuccess={loadFieldMappings}
    />
  </Box>
);

// Component for alias chip with delete
const AliasChip: React.FC<{
  alias: { id: string; csvAlias: string; confidence: number };
  onDelete: (id: string) => void;
}> = ({ alias, onDelete }) => (
  <Chip
    key={alias.id}
    label={`${alias.csvAlias} (${(alias.confidence * 100).toFixed(0)}%)`}
    size="small"
    variant="outlined"
    color={alias.confidence >= 0.9 ? 'success' : alias.confidence >= 0.7 ? 'warning' : 'default'}
    onDelete={() => onDelete(alias.id)}
  />
);

// Row component for each asset field
const AssetFieldRow: React.FC<{
  field: string;
  aliases: Array<{ id: string; csvAlias: string; confidence: number }>;
  onDeleteAlias: (id: string) => void;
  onAddAlias: () => void;
}> = ({ field, aliases, onDeleteAlias, onAddAlias }) => (
  <TableRow key={field}>
    <TableCell>
      <Typography variant="body1" sx={{ fontWeight: 500, color: 'primary.main' }}>
        {field}
      </Typography>
    </TableCell>
    <TableCell>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {aliases.map((alias) => (
          <AliasChip key={alias.id} alias={alias} onDelete={onDeleteAlias} />
        ))}
      </Box>
    </TableCell>
    <TableCell>
      <IconButton 
        size="small" 
        onClick={onAddAlias} 
        color="primary" 
        title={`Add alias for ${field}`}
      >
        <Add />
      </IconButton>
    </TableCell>
  </TableRow>
);

// Management view header component
const ManagementViewHeader: React.FC<{
  onAddMapping: () => void;
}> = ({ onAddMapping }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
    <Typography variant="h5">Field Mapping Configuration</Typography>
    <Button variant="outlined" startIcon={<Add />} onClick={onAddMapping}>
      Add Mapping
    </Button>
  </Box>
);

// Table header component
const ManagementTableHeader: React.FC = () => (
  <TableHead>
    <TableRow>
      <TableCell width="25%">
        <strong>Asset Field</strong>
      </TableCell>
      <TableCell width="60%">
        <strong>CSV Header Aliases</strong>
      </TableCell>
      <TableCell width="15%">
        <strong>Actions</strong>
      </TableCell>
    </TableRow>
  </TableHead>
);

// Management table component
const ManagementTable: React.FC<{
  aliasesByField: Record<string, Array<{ id: string; csvAlias: string; assetField: string; confidence: number }>>;
  handleDeleteAlias: (id: string) => void;
  onAddMapping: () => void;
}> = ({ aliasesByField, handleDeleteAlias, onAddMapping }) => (
  <TableContainer component={Paper}>
    <Table>
      <ManagementTableHeader />
      <TableBody>
        {Object.entries(aliasesByField).sort(([a], [b]) => a.localeCompare(b)).map(([field, aliases]) => (
          <AssetFieldRow
            key={field}
            field={field}
            aliases={aliases}
            onDeleteAlias={handleDeleteAlias}
            onAddAlias={onAddMapping}
          />
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

// Management view component
const FieldMappingsManagementView: React.FC<{
  allAliases: Array<{ id: string; csvAlias: string; assetField: string; confidence: number }>;
  dialogHandlers: ReturnType<typeof useFieldMappingsDialogHandlers>;
  handleDeleteAlias: (id: string) => void;
  loadAllAliases: () => Promise<void>;
}> = ({ allAliases, dialogHandlers, handleDeleteAlias, loadAllAliases }) => {
  // Group aliases by asset field
  const aliasesByField = allAliases.reduce((acc, alias) => {
    if (!acc[alias.assetField]) {
      acc[alias.assetField] = [];
    }
    acc[alias.assetField].push(alias);
    return acc;
  }, {} as Record<string, typeof allAliases>);

  const handleAddMapping = (): void => dialogHandlers.setCreateDialogOpen(true);

  return (
    <Box sx={{ p: 2 }}>
      <ManagementViewHeader onAddMapping={handleAddMapping} />
      <ManagementTable 
        aliasesByField={aliasesByField}
        handleDeleteAlias={handleDeleteAlias}
        onAddMapping={() => dialogHandlers.handleCreateMapping('')}
      />
      <CreateAliasDialog
        open={dialogHandlers.createDialogOpen}
        onClose={dialogHandlers.handleCloseDialog}
        csvHeader={dialogHandlers.selectedCsvHeader}
        onSuccess={loadAllAliases}
      />
    </Box>
  );
};

const useFieldMappingsDialogHandlers = (): {
  createDialogOpen: boolean;
  selectedCsvHeader: string;
  handleCreateMapping: (csvHeader: string) => void;
  handleCloseDialog: () => void;
  setCreateDialogOpen: (open: boolean) => void;
} => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCsvHeader, setSelectedCsvHeader] = useState<string>('');

  const handleCreateMapping = (csvHeader: string): void => {
    setSelectedCsvHeader(csvHeader);
    setCreateDialogOpen(true);
  };

  const handleCloseDialog = (): void => {
    setCreateDialogOpen(false);
    setSelectedCsvHeader('');
  };

  return {
    createDialogOpen,
    selectedCsvHeader,
    handleCreateMapping,
    handleCloseDialog,
    setCreateDialogOpen
  };
};

const FieldMappingsTableContent: React.FC<{
  selectedFile: string | null;
  loading: boolean;
  error: string | null;
  loadFieldMappings: () => void;
  mappedFields: FieldMapping[];
  unmappedFields: string[];
  totalCsvColumns: number;
  coveragePercentage: number;
  createDialogOpen: boolean;
  selectedCsvHeader: string;
  handleCreateMapping: (csvHeader: string) => void;
  handleCloseDialog: () => void;
}> = ({ 
  selectedFile, loading, error, loadFieldMappings, 
  mappedFields, unmappedFields, totalCsvColumns, coveragePercentage,
  createDialogOpen, selectedCsvHeader, handleCreateMapping, handleCloseDialog
}) => {
  if (!selectedFile) return <NoFileState />;
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={loadFieldMappings} />;

  return (
    <FieldMappingsTableLayout
      mappedFields={mappedFields}
      unmappedFields={unmappedFields}
      totalCsvColumns={totalCsvColumns}
      coveragePercentage={coveragePercentage}
      loadFieldMappings={loadFieldMappings}
      handleCreateMapping={handleCreateMapping}
      createDialogOpen={createDialogOpen}
      handleCloseDialog={handleCloseDialog}
      selectedCsvHeader={selectedCsvHeader}
    />
  );
};

// Hook for alias management operations
const useAliasManagement = (): {
  allAliases: Array<{id: string; csvAlias: string; assetField: string; confidence: number}>;
  loadAllAliases: () => Promise<void>;
  handleDeleteAlias: (aliasId: string) => Promise<void>;
} => {
  const [allAliases, setAllAliases] = useState<Array<{
    id: string;
    csvAlias: string;
    assetField: string;
    confidence: number;
  }>>([]);

  const loadAllAliases = useCallback(async (): Promise<void> => {
    try {
      const data = await pipelineApi.getAllAliases();
      setAllAliases(data.aliases);
    } catch (err) {
      console.error('Failed to load aliases:', err);
    }
  }, []);

  const handleDeleteAlias = useCallback(async (aliasId: string): Promise<void> => {
    try {
      await pipelineApi.deleteAlias(aliasId);
      await loadAllAliases(); // Reload after delete
    } catch (err) {
      console.error('Failed to delete alias:', err);
    }
  }, [loadAllAliases]);

  return { allAliases, loadAllAliases, handleDeleteAlias };
};

// Management mode component
const ManagementModeView: React.FC<{
  aliasManagement: ReturnType<typeof useAliasManagement>;
  dialogHandlers: ReturnType<typeof useFieldMappingsDialogHandlers>;
}> = ({ aliasManagement, dialogHandlers }) => (
  <FieldMappingsManagementView
    allAliases={aliasManagement.allAliases}
    dialogHandlers={dialogHandlers}
    handleDeleteAlias={aliasManagement.handleDeleteAlias}
    loadAllAliases={aliasManagement.loadAllAliases}
  />
);

// Pipeline mode component
const PipelineModeView: React.FC<{
  selectedFile: string;
  tableData: ReturnType<typeof useFieldMappingsTable>;
  dialogHandlers: ReturnType<typeof useFieldMappingsDialogHandlers>;
}> = ({ selectedFile, tableData, dialogHandlers }) => (
  <FieldMappingsTableContent
    selectedFile={selectedFile}
    loading={tableData.loading}
    error={tableData.error}
    loadFieldMappings={tableData.loadFieldMappings}
    mappedFields={tableData.mappedFields}
    unmappedFields={tableData.unmappedFields}
    totalCsvColumns={tableData.totalCsvColumns}
    coveragePercentage={tableData.coveragePercentage}
    createDialogOpen={dialogHandlers.createDialogOpen}
    selectedCsvHeader={dialogHandlers.selectedCsvHeader}
    handleCreateMapping={dialogHandlers.handleCreateMapping}
    handleCloseDialog={dialogHandlers.handleCloseDialog}
  />
);

// Main table component logic
const FieldMappingsTableMain: React.FC<FieldMappingsTableProps> = ({ selectedFile }) => {
  const tableData = useFieldMappingsTable(selectedFile);
  const dialogHandlers = useFieldMappingsDialogHandlers();
  const aliasManagement = useAliasManagement();

  // Load all aliases when in management mode (no selectedFile)
  useEffect(() => {
    if (!selectedFile) {
      aliasManagement.loadAllAliases();
    }
    // Note: aliasManagement object would cause infinite loops if included
  }, [selectedFile, aliasManagement.loadAllAliases]); // eslint-disable-line react-hooks/exhaustive-deps

  // Management mode - show all aliases grouped by asset field
  if (!selectedFile) {
    return <ManagementModeView aliasManagement={aliasManagement} dialogHandlers={dialogHandlers} />;
  }

  // Pipeline mode - show file-specific mappings
  return <PipelineModeView selectedFile={selectedFile} tableData={tableData} dialogHandlers={dialogHandlers} />;
};

export const FieldMappingsTable: React.FC<FieldMappingsTableProps> = ({ selectedFile }) => (
  <FieldMappingsTableMain selectedFile={selectedFile} />
);