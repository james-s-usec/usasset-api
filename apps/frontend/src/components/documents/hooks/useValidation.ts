import { useState, useRef } from 'react';
import { config } from '../../../config';
import type { ValidationResult } from '../components/ValidationDialog';

interface PDFFile {
  id: string;
  original_name: string;
  size: number;
  created_at: string;
  pageCount?: number;
  mimetype?: string;
}

export interface ValidationHook {
  validationResult: ValidationResult | null;
  validationDialog: boolean;
  setValidationDialog: (open: boolean) => void;
  validatingFile: string;
  validationProgress: { current: number; total: number };
  isValidating: boolean;
  handleFileValidate: (file: PDFFile) => Promise<void>;
  handleCancelValidation: () => void;
}

const validatePDFFile = async (
  file: PDFFile,
  abortController: AbortController
): Promise<ValidationResult | null> => {
  const response = await fetch(`${config.api.baseUrl}/api/files/${file.id}/pdf-validate`, {
    signal: abortController.signal
  });
  const result = await response.json();
  return result.success ? result.data : null;
};

export const useValidation = (): ValidationHook => {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [validationDialog, setValidationDialog] = useState(false);
  const [validatingFile, setValidatingFile] = useState<string>("");
  const [validationProgress, setValidationProgress] = useState({ current: 0, total: 0 });
  const [isValidating, setIsValidating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const initializeValidation = (file: PDFFile): AbortController => {
    setValidatingFile(file.original_name);
    setIsValidating(true);
    setValidationDialog(true);
    setValidationResult(null);
    
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    const pageCount = file.pageCount || 12;
    setValidationProgress({ current: 0, total: pageCount });
    
    return abortController;
  };

  const handleValidationError = (error: unknown): void => {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('Validation cancelled by user');
    } else {
      console.error('Validation failed:', error);
    }
  };

  const handleFileValidate = async (file: PDFFile): Promise<void> => {
    const abortController = initializeValidation(file);
    
    try {
      const result = await validatePDFFile(file, abortController);
      if (result) {
        setValidationResult(result);
      }
    } catch (error) {
      handleValidationError(error);
    } finally {
      setIsValidating(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelValidation = (): void => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsValidating(false);
      setValidationDialog(false);
    }
  };

  return {
    validationResult,
    validationDialog,
    setValidationDialog,
    validatingFile,
    validationProgress,
    isValidating,
    handleFileValidate,
    handleCancelValidation,
  };
};