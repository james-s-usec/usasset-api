/**
 * Debug Level Color Utilities
 * Maps debug levels to MUI chip colors
 */

export const getLevelColor = (level: string): "default" | "error" | "warning" | "info" | "success" => {
  switch(level) {
    case 'error': return 'error';
    case 'warn': return 'warning';
    case 'info': return 'info';
    case 'debug': return 'success';
    default: return 'default';
  }
};