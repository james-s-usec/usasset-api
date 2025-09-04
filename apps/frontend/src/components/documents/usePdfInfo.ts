import { useState, useEffect, useCallback } from 'react';
import { config } from '../../config';

interface PDFInfo {
  pageCount: number;
  title?: string;
  dimensions: { width: number; height: number };
  maxZoom: number;
  tileSize: number;
}

interface UsePdfInfoResult {
  pdfInfo: PDFInfo | null;
  loading: boolean;
  error: string | null;
}

export const usePdfInfo = (fileId: string): UsePdfInfoResult => {
  const [pdfInfo, setPdfInfo] = useState<PDFInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPdfInfo = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch(`${config.api.baseUrl}/api/files/${fileId}/pdf-info`);
      const result = await response.json();
      
      if (result.success) {
        setPdfInfo(result.data);
        setError(null);
      } else {
        setError('Failed to load PDF information');
      }
    } catch {
      setError('Failed to load PDF information');
    } finally {
      setLoading(false);
    }
  }, [fileId]);

  useEffect(() => {
    loadPdfInfo();
  }, [loadPdfInfo]);

  return { pdfInfo, loading, error };
};