import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
} from '@mui/material';
import { ExpandMore, Search, Clear } from '@mui/icons-material';
import type { Asset } from '../types';

interface BulkEditModalProps {
  open: boolean;
  selectedAssets: Asset[];
  onClose: () => void;
  onSave: (updates: Partial<Asset>) => Promise<void>;
}

type FieldType = 'text' | 'number' | 'select' | 'multiline' | 'boolean' | 'date';

interface FieldDefinition {
  key: keyof Asset;
  label: string;
  type: FieldType;
  options?: string[];
  category: string;
  placeholder?: string;
}

const FIELD_DEFINITIONS: FieldDefinition[] = [
  // Core Information
  { key: 'name', label: 'Asset Name', type: 'text', category: 'Core Information' },
  { key: 'assetTag', label: 'Asset Tag', type: 'text', category: 'Core Information' },
  { key: 'description', label: 'Description', type: 'multiline', category: 'Core Information' },
  { key: 'status', label: 'Status', type: 'select', category: 'Core Information',
    options: ['ACTIVE', 'MAINTENANCE', 'RETIRED', 'DISPOSED', 'INACTIVE', 'LOST', 'STOLEN'] },
  { key: 'condition', label: 'Condition', type: 'select', category: 'Core Information',
    options: ['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'FOR_REPAIR', 'FOR_DISPOSAL'] },
  { key: 'location', label: 'Location', type: 'text', category: 'Core Information' },
  
  // Identification
  { key: 'manufacturer', label: 'Manufacturer', type: 'text', category: 'Identification' },
  { key: 'modelNumber', label: 'Model Number', type: 'text', category: 'Identification' },
  { key: 'serialNumber', label: 'Serial Number', type: 'text', category: 'Identification' },
  { key: 'catalogName', label: 'Catalog Name', type: 'text', category: 'Identification' },
  { key: 'catalogItemId', label: 'Catalog Item ID', type: 'text', category: 'Identification' },
  
  // Location Details
  { key: 'customerName', label: 'Customer Name', type: 'text', category: 'Location Details' },
  { key: 'propertyName', label: 'Property Name', type: 'text', category: 'Location Details' },
  { key: 'buildingName', label: 'Building Name', type: 'text', category: 'Location Details' },
  { key: 'floor', label: 'Floor', type: 'text', category: 'Location Details' },
  { key: 'floorName', label: 'Floor Name', type: 'text', category: 'Location Details' },
  { key: 'area', label: 'Area', type: 'text', category: 'Location Details' },
  { key: 'roomNumber', label: 'Room Number', type: 'text', category: 'Location Details' },
  { key: 'assetLocation', label: 'Asset Location', type: 'text', category: 'Location Details' },
  { key: 'propertyZoneServed', label: 'Property Zone Served', type: 'text', category: 'Location Details' },
  { key: 'xCoordinate', label: 'X Coordinate', type: 'number', category: 'Location Details' },
  { key: 'yCoordinate', label: 'Y Coordinate', type: 'number', category: 'Location Details' },
  
  // Financial/Cost
  { key: 'purchaseCost', label: 'Purchase Cost', type: 'number', category: 'Financial' },
  { key: 'installationCost', label: 'Installation Cost', type: 'number', category: 'Financial' },
  { key: 'annualMaintenanceCost', label: 'Annual Maintenance Cost', type: 'number', category: 'Financial' },
  { key: 'estimatedAnnualOperatingCost', label: 'Est. Annual Operating Cost', type: 'number', category: 'Financial' },
  { key: 'disposalCost', label: 'Disposal Cost', type: 'number', category: 'Financial' },
  { key: 'salvageValue', label: 'Salvage Value', type: 'number', category: 'Financial' },
  { key: 'totalCostOfOwnership', label: 'Total Cost of Ownership', type: 'number', category: 'Financial' },
  { key: 'depreciationMethod', label: 'Depreciation Method', type: 'text', category: 'Financial' },
  { key: 'currentBookValue', label: 'Current Book Value', type: 'number', category: 'Financial' },
  
  // Energy/Power
  { key: 'ratedPowerKw', label: 'Rated Power (kW)', type: 'number', category: 'Energy/Power' },
  { key: 'actualPowerKw', label: 'Actual Power (kW)', type: 'number', category: 'Energy/Power' },
  { key: 'voltage', label: 'Voltage', type: 'number', category: 'Energy/Power' },
  { key: 'amperage', label: 'Amperage', type: 'number', category: 'Energy/Power' },
  { key: 'phase', label: 'Phase', type: 'number', category: 'Energy/Power' },
  { key: 'powerFactor', label: 'Power Factor', type: 'number', category: 'Energy/Power' },
  { key: 'btuRating', label: 'BTU Rating', type: 'number', category: 'Energy/Power' },
  { key: 'dailyOperatingHours', label: 'Daily Operating Hours', type: 'number', category: 'Energy/Power' },
  { key: 'estimatedAnnualKwh', label: 'Est. Annual kWh', type: 'number', category: 'Energy/Power' },
  { key: 'loadFactor', label: 'Load Factor', type: 'number', category: 'Energy/Power' },
  { key: 'energyEfficiencyRating', label: 'Energy Efficiency Rating', type: 'text', category: 'Energy/Power' },
  { key: 'energyEfficiencyValue', label: 'Energy Efficiency Value', type: 'number', category: 'Energy/Power' },
  { key: 'peakDemandKw', label: 'Peak Demand (kW)', type: 'number', category: 'Energy/Power' },
  
  // Lifecycle/Dates
  { key: 'installDate', label: 'Install Date', type: 'date', category: 'Lifecycle/Dates' },
  { key: 'manufactureDate', label: 'Manufacture Date', type: 'date', category: 'Lifecycle/Dates' },
  { key: 'serviceLife', label: 'Service Life (years)', type: 'number', category: 'Lifecycle/Dates' },
  { key: 'expectedLifetime', label: 'Expected Lifetime (years)', type: 'number', category: 'Lifecycle/Dates' },
  { key: 'industryServiceLife', label: 'Industry Service Life', type: 'number', category: 'Lifecycle/Dates' },
  { key: 'observedRemainingLife', label: 'Observed Remaining Life', type: 'number', category: 'Lifecycle/Dates' },
  { key: 'estimatedReplacementDate', label: 'Est. Replacement Date', type: 'date', category: 'Lifecycle/Dates' },
  { key: 'warrantyExpirationDate', label: 'Warranty Expiration Date', type: 'date', category: 'Lifecycle/Dates' },
  
  // Physical Specifications
  { key: 'equipmentSize', label: 'Equipment Size', type: 'text', category: 'Physical Specs' },
  { key: 'size', label: 'Size', type: 'text', category: 'Physical Specs' },
  { key: 'unit', label: 'Unit', type: 'text', category: 'Physical Specs' },
  { key: 'quantity', label: 'Quantity', type: 'number', category: 'Physical Specs' },
  { key: 'squareFeet', label: 'Square Feet', type: 'number', category: 'Physical Specs' },
  { key: 'weight', label: 'Weight', type: 'number', category: 'Physical Specs' },
  
  // Technical Specifications
  { key: 'motorHp', label: 'Motor HP', type: 'number', category: 'Technical Specs' },
  { key: 'numberOfCircuits', label: 'Number of Circuits', type: 'number', category: 'Technical Specs' },
  { key: 'supplyFanMotorSize', label: 'Supply Fan Motor Size', type: 'text', category: 'Technical Specs' },
  { key: 'returnFanMotorSize', label: 'Return Fan Motor Size', type: 'text', category: 'Technical Specs' },
  { key: 'beltSize', label: 'Belt Size', type: 'text', category: 'Technical Specs' },
  { key: 'beltQuantity', label: 'Belt Quantity', type: 'number', category: 'Technical Specs' },
  { key: 'filterType', label: 'Filter Type', type: 'text', category: 'Technical Specs' },
  { key: 'filterSize', label: 'Filter Size', type: 'text', category: 'Technical Specs' },
  { key: 'filterQuantity', label: 'Filter Quantity', type: 'number', category: 'Technical Specs' },
  { key: 'refrigerant', label: 'Refrigerant', type: 'text', category: 'Technical Specs' },
  { key: 'refrigerantDescription', label: 'Refrigerant Description', type: 'text', category: 'Technical Specs' },
  { key: 'refrigerantQuantity', label: 'Refrigerant Quantity', type: 'number', category: 'Technical Specs' },
  
  // Vendor/Service
  { key: 'vendor', label: 'Vendor', type: 'text', category: 'Vendor/Service' },
  { key: 'vendorWebsite', label: 'Vendor Website', type: 'text', category: 'Vendor/Service' },
  { key: 'serviceId', label: 'Service ID', type: 'text', category: 'Vendor/Service' },
  
  // Categorization
  { key: 'trade', label: 'Trade', type: 'text', category: 'Categorization' },
  { key: 'title', label: 'Title', type: 'text', category: 'Categorization' },
  { key: 'preconSystem', label: 'Precon System', type: 'text', category: 'Categorization' },
  { key: 'operationsSystem', label: 'Operations System', type: 'text', category: 'Categorization' },
  { key: 'systemCategory', label: 'System Category', type: 'text', category: 'Categorization' },
  { key: 'assetCategory', label: 'Asset Category', type: 'text', category: 'Categorization' },
  { key: 'assetCategoryName', label: 'Asset Category Name', type: 'text', category: 'Categorization' },
  { key: 'assetType', label: 'Asset Type', type: 'text', category: 'Categorization' },
  { key: 'type', label: 'Type', type: 'text', category: 'Categorization' },
  
  // Notes
  { key: 'notes', label: 'General Notes', type: 'multiline', category: 'Notes' },
  { key: 'note1Subject', label: 'Note 1 Subject', type: 'text', category: 'Notes' },
  { key: 'note1', label: 'Note 1', type: 'multiline', category: 'Notes' },
  { key: 'note2Subject', label: 'Note 2 Subject', type: 'text', category: 'Notes' },
  { key: 'note2', label: 'Note 2', type: 'multiline', category: 'Notes' },
  { key: 'note3Subject', label: 'Note 3 Subject', type: 'text', category: 'Notes' },
  { key: 'note3', label: 'Note 3', type: 'multiline', category: 'Notes' },
  
  // Verification
  { key: 'verified', label: 'Verified', type: 'boolean', category: 'Verification' },
];

// Helper function to render clear button
const renderClearButton = (value: string | number | undefined | null, onClear: () => void): React.ReactElement | null => {
  if (value === '' || value === undefined || value === null) return null;
  
  return (
    <InputAdornment position="end">
      <Button size="small" onClick={onClear}>
        <Clear fontSize="small" />
      </Button>
    </InputAdornment>
  );
};

// Helper function to render select field
const renderSelectField = (
  field: FieldDefinition,
  value: string | undefined,
  onChange: (value: string | undefined) => void
): React.ReactElement => {
  return (
    <FormControl fullWidth size="small" key={field.key}>
      <InputLabel>{field.label}</InputLabel>
      <Select
        value={value}
        label={field.label}
        onChange={(e) => onChange(e.target.value)}
      >
        <MenuItem value="">
          <em>No change</em>
        </MenuItem>
        {field.options?.map(option => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

// Helper function to render number field
const renderNumberField = (
  field: FieldDefinition,
  value: number | null | undefined,
  onChange: (value: number | null) => void,
  onClear: () => void
): React.ReactElement => {
  return (
    <TextField
      key={field.key}
      fullWidth
      size="small"
      type="number"
      label={field.label}
      value={value}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      placeholder="Leave empty for no change"
      InputProps={{
        endAdornment: renderClearButton(value, onClear)
      }}
    />
  );
};

// Helper function to render text field
const renderTextField = (
  options: {
    field: FieldDefinition;
    value: string | undefined;
    onChange: (value: string | undefined) => void;
    onClear: () => void;
    multiline?: boolean;
  }
): React.ReactElement => {
  const { field, value, onChange, onClear, multiline = false } = options;
  return (
    <TextField
      key={field.key}
      fullWidth
      size="small"
      label={field.label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Leave empty for no change"
      multiline={multiline}
      rows={multiline ? 2 : undefined}
      InputProps={{
        endAdornment: renderClearButton(value, onClear)
      }}
    />
  );
};

// Helper function to render date field
const renderDateField = (
  field: FieldDefinition,
  value: string | undefined,
  onChange: (value: string | undefined) => void,
  onClear: () => void
): React.ReactElement => {
  return (
    <TextField
      key={field.key}
      fullWidth
      size="small"
      type="date"
      label={field.label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Leave empty for no change"
      InputLabelProps={{ shrink: true }}
      InputProps={{
        endAdornment: renderClearButton(value, onClear)
      }}
    />
  );
};

// Helper function to render boolean field
const renderBooleanField = (
  field: FieldDefinition,
  value: boolean | null | undefined,
  onChange: (value: boolean | null | undefined) => void
): React.ReactElement => {
  const displayValue = value === true ? 'true' : value === false ? 'false' : '';
  
  return (
    <FormControl fullWidth size="small" key={field.key}>
      <InputLabel>{field.label}</InputLabel>
      <Select
        value={displayValue}
        label={field.label}
        onChange={(e) => {
          const newValue = e.target.value === 'true' ? true : 
                          e.target.value === 'false' ? false : null;
          onChange(newValue);
        }}
      >
        <MenuItem value="">
          <em>No change</em>
        </MenuItem>
        <MenuItem value="true">Yes</MenuItem>
        <MenuItem value="false">No</MenuItem>
      </Select>
    </FormControl>
  );
};

// Helper function for rendering individual fields
const createFieldRenderer = (
  formData: Partial<Asset>,
  handleFieldChange: (field: keyof Asset, value: string | number | boolean | null | undefined) => void,
  clearField: (field: keyof Asset) => void
): ((field: FieldDefinition) => React.ReactElement) => {
  return (field: FieldDefinition): React.ReactElement => {
    const value = formData[field.key] ?? '';
    const onChange = (val: string | number | boolean | null | undefined): void => handleFieldChange(field.key, val);
    const onClear = (): void => clearField(field.key);
    
    switch (field.type) {
      case 'select':
        return renderSelectField(field, value as string | undefined, onChange as (value: string | undefined) => void);
      case 'number':
        return renderNumberField(field, value as number | null | undefined, onChange as (value: number | null) => void, onClear);
      case 'multiline':
        return renderTextField({ field, value: value as string | undefined, onChange: onChange as (value: string | undefined) => void, onClear, multiline: true });
      case 'date':
        return renderDateField(field, value as string | undefined, onChange as (value: string | undefined) => void, onClear);
      case 'boolean':
        return renderBooleanField(field, value as boolean | null | undefined, onChange as (value: boolean | null | undefined) => void);
      default:
        return renderTextField({ field, value: value as string | undefined, onChange: onChange as (value: string | undefined) => void, onClear, multiline: false });
    }
  };
};

// Component for selected assets summary
const SelectedAssetsSummary: React.FC<{ selectedAssets: Asset[] }> = ({ selectedAssets }) => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="subtitle2" gutterBottom>
      Selected Assets:
    </Typography>
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, maxHeight: 100, overflow: 'auto' }}>
      {selectedAssets.slice(0, 10).map(asset => (
        <Chip
          key={asset.id}
          label={asset.assetTag || asset.name}
          size="small"
          variant="outlined"
        />
      ))}
      {selectedAssets.length > 10 && (
        <Chip
          label={`+${selectedAssets.length - 10} more`}
          size="small"
          variant="outlined"
          color="primary"
        />
      )}
    </Box>
  </Box>
);

// Component for search bar
const SearchBar: React.FC<{
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}> = ({ searchTerm, setSearchTerm }) => (
  <TextField
    fullWidth
    size="small"
    placeholder="Search fields... (e.g. 'power', 'location', 'cost')"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    sx={{ mb: 2 }}
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <Search />
        </InputAdornment>
      ),
      endAdornment: searchTerm && (
        <InputAdornment position="end">
          <Button size="small" onClick={() => setSearchTerm('')}>
            <Clear />
          </Button>
        </InputAdornment>
      ),
    }}
  />
);

// Component for field categories
const FieldCategories: React.FC<{
  categorizedFields: Record<string, FieldDefinition[]>;
  expandedCategories: Set<string>;
  handleCategoryToggle: (category: string) => void;
  renderField: (field: FieldDefinition) => React.ReactElement;
}> = ({ categorizedFields, expandedCategories, handleCategoryToggle, renderField }) => (
  <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
    {Object.entries(categorizedFields).map(([category, fields]) => (
      <Accordion 
        key={category}
        expanded={expandedCategories.has(category)}
        onChange={() => handleCategoryToggle(category)}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1">
            {category} ({fields.length} field{fields.length > 1 ? 's' : ''})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
            {fields.map(renderField)}
          </Box>
        </AccordionDetails>
      </Accordion>
    ))}
  </Box>
);

// Helper for form validation
const validateFormData = (formData: Partial<Asset>): string | null => {
  const hasChanges = Object.keys(formData).some(
    key => formData[key as keyof Asset] !== undefined
  );
  return hasChanges ? null : 'Please modify at least one field to update';
};

// Form state handlers
const createFormHandlers = (
  setFormData: React.Dispatch<React.SetStateAction<Partial<Asset>>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>
): {
  handleFieldChange: (field: keyof Asset, value: string | number | boolean | null | undefined) => void;
  clearField: (field: keyof Asset) => void;
  resetForm: () => void;
} => ({
  handleFieldChange: (field: keyof Asset, value: string | number | boolean | null | undefined): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value === '' || value === null ? undefined : value,
    }));
  },
  clearField: (field: keyof Asset): void => {
    setFormData(prev => {
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
  },
  resetForm: (): void => {
    setFormData({});
    setError(null);
  }
});

// Save handler dependencies
interface SaveHandlerDeps {
  formData: Partial<Asset>;
  onSave: (updates: Partial<Asset>) => Promise<void>;
  onClose: () => void;
  resetForm: () => void;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

// Save handler
const createSaveHandler = (deps: SaveHandlerDeps) => async (): Promise<void> => {
  const validationError = validateFormData(deps.formData);
  if (validationError) {
    deps.setError(validationError);
    return;
  }
  deps.setLoading(true);
  deps.setError(null);
  try {
    await deps.onSave(deps.formData);
    deps.onClose();
    deps.resetForm();
  } catch (err) {
    deps.setError(err instanceof Error ? err.message : 'Failed to update assets');
  } finally {
    deps.setLoading(false);
  }
};

// Custom hook for form state management
const useFormState = (
  onSave: (updates: Partial<Asset>) => Promise<void>,
  onClose: () => void
): {
  formData: Partial<Asset>;
  loading: boolean;
  error: string | null;
  handleFieldChange: (field: keyof Asset, value: string | number | boolean | null | undefined) => void;
  clearField: (field: keyof Asset) => void;
  handleSave: () => Promise<void>;
  resetForm: () => void;
} => {
  const [formData, setFormData] = useState<Partial<Asset>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlers = createFormHandlers(setFormData, setError);
  const handleSave = createSaveHandler({
    formData, onSave, onClose, resetForm: handlers.resetForm, setLoading, setError
  });

  return { formData, loading, error, ...handlers, handleSave };
};

// Helper for field filtering
const filterAndGroupFields = (searchTerm: string): Record<string, FieldDefinition[]> => {
  const filteredFields = FIELD_DEFINITIONS.filter(field =>
    field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return filteredFields.reduce((acc, field) => {
    if (!acc[field.category]) acc[field.category] = [];
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, FieldDefinition[]>);
};

// Custom hook for search and category management
const useFieldFiltering = (): {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  expandedCategories: Set<string>;
  categorizedFields: Record<string, FieldDefinition[]>;
  handleCategoryToggle: (category: string) => void;
  resetSearch: () => void;
} => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['Core Information'])
  );

  const categorizedFields = useMemo(() => filterAndGroupFields(searchTerm), [searchTerm]);

  const handleCategoryToggle = (category: string): void => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const resetSearch = (): void => setSearchTerm('');

  return { searchTerm, setSearchTerm, expandedCategories, categorizedFields, handleCategoryToggle, resetSearch };
};

// Dialog header component
const BulkEditHeader: React.FC<{ 
  selectedAssets: Asset[];
  changedFieldsCount: number;
}> = ({ selectedAssets, changedFieldsCount }) => (
  <DialogTitle>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Box>
        <Typography variant="h6">Bulk Edit Assets</Typography>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
          Editing {selectedAssets.length} selected asset{selectedAssets.length !== 1 ? 's' : ''}
          {changedFieldsCount > 0 && ` • ${changedFieldsCount} field${changedFieldsCount > 1 ? 's' : ''} modified`}
        </Typography>
      </Box>
    </Box>
  </DialogTitle>
);

// Dialog content component
const BulkEditContent: React.FC<{
  error: string | null;
  selectedAssets: Asset[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  categorizedFields: Record<string, FieldDefinition[]>;
  expandedCategories: Set<string>;
  handleCategoryToggle: (category: string) => void;
  renderField: (field: FieldDefinition) => React.ReactElement;
}> = ({ error, selectedAssets, searchTerm, setSearchTerm, categorizedFields, expandedCategories, handleCategoryToggle, renderField }) => (
  <DialogContent>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    <SelectedAssetsSummary selectedAssets={selectedAssets} />
    <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
    <FieldCategories
      categorizedFields={categorizedFields}
      expandedCategories={expandedCategories}
      handleCategoryToggle={handleCategoryToggle}
      renderField={renderField}
    />
    <Alert severity="info" sx={{ mt: 2 }}>
      <strong>Tip:</strong> Use the search bar to quickly find fields. Only fields with values will be updated. 
      Click the ✗ button next to a field to clear it.
    </Alert>
  </DialogContent>
);

// Dialog actions component
const BulkEditActions: React.FC<{
  handleClose: () => void;
  handleSave: () => Promise<void>;
  loading: boolean;
  changedFieldsCount: number;
  selectedAssets: Asset[];
}> = ({ handleClose, handleSave, loading, changedFieldsCount, selectedAssets }) => (
  <DialogActions>
    <Button onClick={handleClose} disabled={loading}>Cancel</Button>
    <Button 
      onClick={handleSave} 
      variant="contained" 
      disabled={loading || changedFieldsCount === 0}
    >
      {loading ? 'Updating...' : `Update ${selectedAssets.length} Asset${selectedAssets.length !== 1 ? 's' : ''}`}
    </Button>
  </DialogActions>
);

// Modal content wrapper
const BulkEditModalContent: React.FC<{
  formState: ReturnType<typeof useFormState>;
  fieldFiltering: ReturnType<typeof useFieldFiltering>;
  selectedAssets: Asset[];
  handleClose: () => void;
}> = ({ formState, fieldFiltering, selectedAssets, handleClose }) => {
  const renderField = createFieldRenderer(formState.formData, formState.handleFieldChange, formState.clearField);
  const changedFieldsCount = Object.keys(formState.formData).filter(
    key => formState.formData[key as keyof Asset] !== undefined
  ).length;

  return (
    <>
      <BulkEditHeader selectedAssets={selectedAssets} changedFieldsCount={changedFieldsCount} />
      <BulkEditContent
        error={formState.error}
        selectedAssets={selectedAssets}
        searchTerm={fieldFiltering.searchTerm}
        setSearchTerm={fieldFiltering.setSearchTerm}
        categorizedFields={fieldFiltering.categorizedFields}
        expandedCategories={fieldFiltering.expandedCategories}
        handleCategoryToggle={fieldFiltering.handleCategoryToggle}
        renderField={renderField}
      />
      <BulkEditActions
        handleClose={handleClose}
        handleSave={formState.handleSave}
        loading={formState.loading}
        changedFieldsCount={changedFieldsCount}
        selectedAssets={selectedAssets}
      />
    </>
  );
};

export const BulkEditModal: React.FC<BulkEditModalProps> = ({ open, selectedAssets, onClose, onSave }) => {
  const formState = useFormState(onSave, onClose);
  const fieldFiltering = useFieldFiltering();

  const handleClose = (): void => {
    formState.resetForm();
    fieldFiltering.resetSearch();
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="lg" 
      fullWidth
    >
      <BulkEditModalContent 
        formState={formState}
        fieldFiltering={fieldFiltering}
        selectedAssets={selectedAssets}
        handleClose={handleClose}
      />
    </Dialog>
  );
};