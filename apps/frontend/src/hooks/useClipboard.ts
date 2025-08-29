import { useCallback } from 'react';

export function useClipboard(): {
  copyToClipboard: (text: string, successMessage?: string) => void;
  copyJsonToClipboard: (data: unknown, successMessage?: string) => void;
} {
  const copyToClipboard = useCallback((text: string, successMessage = 'Copied to clipboard!'): void => {
    navigator.clipboard.writeText(text);
    alert(successMessage);
  }, []);

  const copyJsonToClipboard = useCallback((data: unknown, successMessage = 'JSON copied to clipboard!'): void => {
    const jsonText = JSON.stringify(data, null, 2);
    copyToClipboard(jsonText, successMessage);
  }, [copyToClipboard]);

  return { copyToClipboard, copyJsonToClipboard };
}