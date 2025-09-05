import { useState, useRef } from 'react';
import type { ValidationResult } from '../components/ValidationDialog';


export interface ValidationState {
  validationResult: ValidationResult | null;
  validationDialog: boolean;
  validatingFile: string;
  validationProgress: { current: number; total: number };
  isValidating: boolean;
  abortControllerRef: React.MutableRefObject<AbortController | null>;
}

export interface ValidationActions {
  setValidationResult: (result: ValidationResult | null) => void;
  setValidationDialog: (open: boolean) => void;
  setValidatingFile: (file: string) => void;
  setValidationProgress: (progress: { current: number; total: number }) => void;
  setIsValidating: (validating: boolean) => void;
}

export const useValidationState = (): ValidationState & ValidationActions => {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [validationDialog, setValidationDialog] = useState(false);
  const [validatingFile, setValidatingFile] = useState<string>("");
  const [validationProgress, setValidationProgress] = useState({ current: 0, total: 0 });
  const [isValidating, setIsValidating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  return {
    validationResult,
    validationDialog,
    validatingFile,
    validationProgress,
    isValidating,
    abortControllerRef,
    setValidationResult,
    setValidationDialog,
    setValidatingFile,
    setValidationProgress,
    setIsValidating,
  };
};