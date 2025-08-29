/**
 * Clipboard Copy Utilities
 * Simple clipboard operations
 */

export const copyToClipboard = async (text: string): Promise<void> => {
  await navigator.clipboard.writeText(text);
};

export const showCopySuccess = (message: string): void => {
  alert(message);
};

export const formatError = (error: unknown): string => {
  return error instanceof Error ? error.message : String(error);
};