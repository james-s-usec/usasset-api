import { useState, useEffect, useCallback } from 'react';
import { config } from '../../config';

interface PDFValidation {
  totalPages: number;
  validPages: number[];
  invalidPages: Array<{ page: number; error: string }>;
}

interface UsePdfValidationResult {
  validation: PDFValidation | null;
  loading: boolean;
  error: string | null;
}

export const usePdfValidation = (fileId: string): UsePdfValidationResult => {
  const [validation, setValidation] = useState<PDFValidation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadValidation = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch(`${config.api.baseUrl}/api/files/${fileId}/pdf-validate`);
      const result = await response.json();
      
      if (result.success) {
        setValidation(result.data);
        setError(null);
      } else {
        setError('Failed to validate PDF pages');
      }
    } catch {
      setError('Failed to validate PDF pages');
    } finally {
      setLoading(false);
    }
  }, [fileId]);

  useEffect(() => {
    if (fileId) {
      loadValidation();
    }
  }, [fileId, loadValidation]);

  return { validation, loading, error };
};