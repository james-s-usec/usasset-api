/**
 * Debug clipboard utilities
 * Handles copying debug information to clipboard
 */

import type { DebugMessage } from '../components/DebugConsole';

export function copyDebugInfo(messages: DebugMessage[], errorCount: number): void {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    messages: messages.slice(0, 10),
    totalCount: messages.length,
    errorCount,
    url: window.location.href,
    userAgent: navigator.userAgent
  };
  navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
}