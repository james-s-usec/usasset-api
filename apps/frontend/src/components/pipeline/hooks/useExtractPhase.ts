import { useEffect, useState, useCallback } from 'react';
import { pipelineApi } from '../../../services/pipelineApi';

export interface ValidationResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: string[];
  sampleValidData: Array<{
    rowNumber: number;
    rawData: Record<string, string>;
    mappedData: Record<string, string>;
  }>;
  sampleInvalidData: Array<{
    rowNumber: number;
    rawData: Record<string, string>;
    errors: string[];
  }>;
}

export interface ExtractData {
  rawData: Record<string, string>[] | null;
  loading: boolean;
  totalRows: number;
  validationResult: ValidationResult | null;
  validating: boolean;
  handleValidation: () => Promise<void>;
}

// Custom hook for file preview data
const useFilePreview = (selectedFile: string | null, currentJobId: string | null): {
  rawData: Record<string, string>[] | null;
  loading: boolean;
  totalRows: number;
} => {
  const [rawData, setRawData] = useState<Record<string, string>[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);

  useEffect(() => {
    if (selectedFile && !currentJobId) {
      loadFilePreview(selectedFile, setLoading, setRawData, setTotalRows);
    }
  }, [selectedFile, currentJobId]);

  return { rawData, loading, totalRows };
};

// Helper function for loading file preview
const loadFilePreview = async (
  selectedFile: string,
  setLoading: (loading: boolean) => void,
  setRawData: (data: Record<string, string>[] | null) => void,
  setTotalRows: (rows: number) => void
): Promise<void> => {
  setLoading(true);
  try {
    const preview = await pipelineApi.previewFile(selectedFile);
    setRawData(preview.data);
    setTotalRows(preview.totalRows);
  } catch (err) {
    console.error('Failed to load preview:', err);
    setRawData(null);
  } finally {
    setLoading(false);
  }
};

// Custom hook for file validation
const useFileValidation = (selectedFile: string | null): {
  validationResult: ValidationResult | null;
  validating: boolean;
  handleValidation: () => Promise<void>;
} => {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [validating, setValidating] = useState(false);

  const handleValidation = useCallback(async (): Promise<void> => {
    if (!selectedFile) return;
    
    await performValidation(selectedFile, setValidating, setValidationResult);
  }, [selectedFile]);

  return { validationResult, validating, handleValidation };
};

// Helper function for performing validation
const performValidation = async (
  selectedFile: string,
  setValidating: (validating: boolean) => void,
  setValidationResult: (result: ValidationResult) => void
): Promise<void> => {
  setValidating(true);
  try {
    const result = await pipelineApi.validateFile(selectedFile);
    setValidationResult(result);
  } catch (err) {
    console.error('Validation failed:', err);
    setValidationResult(createErrorValidationResult());
  } finally {
    setValidating(false);
  }
};

// Helper function to create error validation result
const createErrorValidationResult = (): ValidationResult => ({
  totalRows: 0,
  validRows: 0,
  invalidRows: 0,
  errors: ['Validation failed'],
  sampleValidData: [],
  sampleInvalidData: []
});

export const useExtractPhase = (
  selectedFile: string | null,
  currentJobId: string | null
): ExtractData => {
  const { rawData, loading, totalRows } = useFilePreview(selectedFile, currentJobId);
  const { validationResult, validating, handleValidation } = useFileValidation(selectedFile);

  return {
    rawData,
    loading,
    totalRows,
    validationResult,
    validating,
    handleValidation
  };
};