import type { ValidationResult } from '../components/ValidationDialog';
import { useValidationState } from './useValidationState';
import { createValidationActions } from './useValidationActions';

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


export const useValidation = (): ValidationHook => {
  const state = useValidationState();
  const actions = createValidationActions(state);

  return {
    validationResult: state.validationResult,
    validationDialog: state.validationDialog,
    setValidationDialog: state.setValidationDialog,
    validatingFile: state.validatingFile,
    validationProgress: state.validationProgress,
    isValidating: state.isValidating,
    handleFileValidate: actions.handleFileValidate,
    handleCancelValidation: actions.handleCancelValidation,
  };
};