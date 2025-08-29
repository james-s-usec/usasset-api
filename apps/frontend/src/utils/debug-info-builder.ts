/**
 * Debug Info Builder Utilities
 * Builds system debug information
 */

export const buildSystemInfo = (): Record<string, unknown> => ({
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  url: window.location.href
});

export const buildStorageInfo = (): Record<string, unknown> => ({
  localStorage: { ...localStorage },
  sessionStorage: { ...sessionStorage }
});

export const buildCompleteDebugInfo = (): Record<string, unknown> => ({
  ...buildSystemInfo(),
  ...buildStorageInfo()
});