import { config } from '../../../config';
import type { ValidationResult } from '../components/ValidationDialog';
import type { ValidationState, ValidationActions } from './useValidationState';

interface PDFFile {
  id: string;
  original_name: string;
  size: number;
  created_at: string;
  pageCount?: number;
  mimetype?: string;
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

const handleValidationError = (error: unknown): void => {
  if (error instanceof Error && error.name === 'AbortError') {
    console.log('Validation cancelled by user');
  } else {
    console.error('Validation failed:', error);
  }
};

const initializeValidation = (file: PDFFile, state: ValidationState & ValidationActions): AbortController => {
  state.setValidatingFile(file.original_name);
  state.setIsValidating(true);
  state.setValidationDialog(true);
  state.setValidationResult(null);
  
  const abortController = new AbortController();
  state.abortControllerRef.current = abortController;
  
  const pageCount = file.pageCount || 12;
  state.setValidationProgress({ current: 0, total: pageCount });
  
  return abortController;
};

const executeValidation = async (file: PDFFile, abortController: AbortController, state: ValidationState & ValidationActions): Promise<void> => {
  try {
    const result = await validatePDFFile(file, abortController);
    if (result) {
      state.setValidationResult(result);
    }
  } catch (error) {
    handleValidationError(error);
  } finally {
    state.setIsValidating(false);
    state.abortControllerRef.current = null;
  }
};

export const createValidationActions = (state: ValidationState & ValidationActions): {
  handleFileValidate: (file: PDFFile) => Promise<void>;
  handleCancelValidation: () => void;
} => {
  const handleFileValidate = async (file: PDFFile): Promise<void> => {
    const abortController = initializeValidation(file, state);
    await executeValidation(file, abortController, state);
  };

  const handleCancelValidation = (): void => {
    if (state.abortControllerRef.current) {
      state.abortControllerRef.current.abort();
      state.setIsValidating(false);
      state.setValidationDialog(false);
    }
  };

  return {
    handleFileValidate,
    handleCancelValidation,
  };
};