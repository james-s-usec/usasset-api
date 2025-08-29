/**
 * Debug Message Utilities
 * Helper functions for debug message handling
 */

import type { DebugMessage } from '../components/DebugConsole';
import type { LogEntry } from '../services/logs-api';

export function convertLogEntryToDebugMessage(logEntry: LogEntry): DebugMessage {
  return {
    id: logEntry.id,
    level: logEntry.level.toLowerCase() as DebugMessage['level'],
    message: logEntry.message,
    timestamp: new Date(logEntry.created_at),
    data: logEntry.metadata,
    category: logEntry.category || 'general'
  };
}

export function createDebugMessage(
  level: DebugMessage['level'],
  message: string,
  data?: unknown
): DebugMessage {
  return {
    id: Date.now().toString(),
    level,
    message,
    timestamp: new Date(),
    data,
    category: 'frontend'
  };
}

export function filterMessagesByLevel(
  messages: DebugMessage[],
  level?: DebugMessage['level']
): DebugMessage[] {
  if (!level) return messages;
  return messages.filter(msg => msg.level === level);
}

export function sortMessagesByTime(messages: DebugMessage[]): DebugMessage[] {
  return [...messages].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}