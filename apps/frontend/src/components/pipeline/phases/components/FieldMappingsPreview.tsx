import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Alert, 
  Chip, 
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon 
} from '@mui/icons-material';
import { pipelineApi } from '../../../../services/pipelineApi';

interface FieldMapping {
  csvHeader: string;
  assetField: string;
  confidence: number;
  isMapped: boolean;
}

interface FieldMappingsPreviewProps {
  csvHeaders: string[];
}

// Component for mapping coverage stats
const MappingStats: React.FC<{ mappings: FieldMapping[] }> = ({ mappings }) => {
  const mapped = mappings.filter(m => m.isMapped).length;
  const total = mappings.length;
  const coverage = total > 0 ? Math.round((mapped / total) * 100) : 0;
  
  return (
    <Box sx={{ mb: 2 }}>
      <Box display="flex" gap={2} alignItems="center">
        <Typography variant="h6" color="primary">
          Field Mapping Coverage
        </Typography>
        <Chip 
          label={`${mapped}/${total} fields (${coverage}%)`}
          color={coverage >= 80 ? 'success' : coverage >= 50 ? 'warning' : 'error'}
          variant="outlined"
        />
      </Box>
    </Box>
  );
};

// Component for mapped fields list
const MappedFieldsList: React.FC<{ mappings: FieldMapping[] }> = ({ mappings }) => {
  const mappedFields = mappings.filter(m => m.isMapped);
  
  if (mappedFields.length === 0) return null;
  
  return (
    <List dense>
      {mappedFields.slice(0, 8).map((mapping, index) => (
        <ListItem key={index} sx={{ py: 0.5 }}>
          <ListItemIcon>
            <CheckCircleIcon color="success" fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={`"${mapping.csvHeader}"`}
            secondary={`→ ${mapping.assetField} (${mapping.confidence}% confidence)`}
            primaryTypographyProps={{ variant: 'body2', fontFamily: 'monospace' }}
            secondaryTypographyProps={{ variant: 'caption' }}
          />
        </ListItem>
      ))}
      {mappedFields.length > 8 && (
        <ListItem>
          <ListItemText
            primary={`... and ${mappedFields.length - 8} more mapped fields`}
            primaryTypographyProps={{ variant: 'caption', fontStyle: 'italic' }}
          />
        </ListItem>
      )}
    </List>
  );
};

// Component for unmapped fields list  
const UnmappedFieldsList: React.FC<{ mappings: FieldMapping[] }> = ({ mappings }) => {
  const unmappedFields = mappings.filter(m => !m.isMapped);
  
  if (unmappedFields.length === 0) return null;
  
  return (
    <List dense>
      {unmappedFields.slice(0, 5).map((mapping, index) => (
        <ListItem key={index} sx={{ py: 0.5 }}>
          <ListItemIcon>
            <WarningIcon color="warning" fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={`"${mapping.csvHeader}"`}
            secondary="No mapping found - data will be skipped"
            primaryTypographyProps={{ variant: 'body2', fontFamily: 'monospace' }}
            secondaryTypographyProps={{ variant: 'caption', color: 'warning.main' }}
          />
        </ListItem>
      ))}
      {unmappedFields.length > 5 && (
        <ListItem>
          <ListItemText
            primary={`... and ${unmappedFields.length - 5} more unmapped fields`}
            primaryTypographyProps={{ variant: 'caption', fontStyle: 'italic' }}
          />
        </ListItem>
      )}
    </List>
  );
};

// Helper function to create mapping results
const createMappingResults = (
  csvHeaders: string[], 
  aliases: Array<{csvAlias: string; assetField: string; confidence: number}>
): FieldMapping[] => {
  return csvHeaders.map(header => {
    const alias = aliases.find(a => a.csvAlias === header);
    return {
      csvHeader: header,
      assetField: alias?.assetField || '',
      confidence: alias?.confidence || 0,
      isMapped: !!alias
    };
  });
};

// Helper function to create fallback mappings
const createFallbackMappings = (csvHeaders: string[]): FieldMapping[] => {
  return csvHeaders.map(header => ({
    csvHeader: header,
    assetField: '',
    confidence: 0,
    isMapped: false
  }));
};

// Custom hook for field mappings data
const useFieldMappings = (csvHeaders: string[]): { mappings: FieldMapping[]; loading: boolean } => {
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFieldMappings = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const aliases = await pipelineApi.getAllAliases();
      const mappingResults = createMappingResults(csvHeaders, aliases.aliases);
      setMappings(mappingResults);
    } catch (error) {
      console.error('Failed to load field mappings:', error);
      setMappings(createFallbackMappings(csvHeaders));
    } finally {
      setLoading(false);
    }
  }, [csvHeaders]);

  useEffect(() => {
    if (csvHeaders.length > 0) {
      loadFieldMappings();
    }
  }, [csvHeaders, loadFieldMappings]);

  return { mappings, loading };
};

// Component for coverage warning
const CoverageWarning: React.FC<{ coveragePercent: number }> = ({ coveragePercent }) => {
  if (coveragePercent >= 50) return null;
  
  return (
    <Alert severity="warning" sx={{ mb: 2 }}>
      Low field mapping coverage ({coveragePercent}%). Consider adding more aliases in Rules Management → Field Mappings.
    </Alert>
  );
};

export const FieldMappingsPreview: React.FC<FieldMappingsPreviewProps> = ({ csvHeaders }) => {
  const { mappings, loading } = useFieldMappings(csvHeaders);

  if (csvHeaders.length === 0) return null;

  if (loading) {
    return (
      <Alert severity="info" icon={<InfoIcon />}>
        Analyzing field mappings for CSV headers...
      </Alert>
    );
  }

  const mappedCount = mappings.filter(m => m.isMapped).length;
  const unmappedCount = mappings.filter(m => !m.isMapped).length;
  const coveragePercent = mappings.length > 0 ? Math.round((mappedCount / mappings.length) * 100) : 0;

  return (
    <FieldMappingsContent 
      mappings={mappings}
      coveragePercent={coveragePercent}
      mappedCount={mappedCount}
      unmappedCount={unmappedCount}
    />
  );
};

// Extracted main content component
const FieldMappingsContent: React.FC<{
  mappings: FieldMapping[];
  coveragePercent: number;
  mappedCount: number;
  unmappedCount: number;
}> = ({ mappings, coveragePercent, mappedCount, unmappedCount }) => (
  <Box>
    <MappingStats mappings={mappings} />
    <CoverageWarning coveragePercent={coveragePercent} />
    
    <Accordion defaultExpanded={coveragePercent < 80}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle2">
          Mapped Fields ({mappedCount} fields)
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <MappedFieldsList mappings={mappings} />
      </AccordionDetails>
    </Accordion>
    
    {unmappedCount > 0 && (
      <Accordion defaultExpanded={unmappedCount > 0}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2" color="warning.main">
            Unmapped Fields ({unmappedCount} fields)
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <UnmappedFieldsList mappings={mappings} />
        </AccordionDetails>
      </Accordion>
    )}
  </Box>
);