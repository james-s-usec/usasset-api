import type { NewRuleData } from './types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateRule = (rule: NewRuleData): ValidationResult => {
  const errors: string[] = [];

  if (!rule.name.trim()) {
    errors.push('Rule name is required');
  }

  if (!rule.target.trim()) {
    errors.push('Target field is required');
  }

  if (rule.priority < 1 || rule.priority > 1000) {
    errors.push('Priority must be between 1 and 1000');
  }

  try {
    JSON.parse(rule.config);
  } catch {
    errors.push('Configuration must be valid JSON');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const getConfigPlaceholder = (ruleType: string): string => {
  switch (ruleType) {
    case 'TRIM':
      return '{"sides": "both"}';
    case 'TO_UPPERCASE':
      return '{"fields": ["name", "manufacturer"]}';
    case 'REGEX_REPLACE':
      return '{"pattern": "\\\\s+", "replacement": " "}';
    default:
      return '{}';
  }
};

export const getConfigHelperText = (ruleType: string): string => {
  switch (ruleType) {
    case 'TO_UPPERCASE':
      return 'For multiple fields: {"fields": ["name", "manufacturer"]}';
    case 'TRIM':
      return 'Options: {"sides": "both|left|right"}';
    default:
      return 'Rule-specific configuration in JSON format';
  }
};