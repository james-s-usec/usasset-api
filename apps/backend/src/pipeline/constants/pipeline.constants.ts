/**
 * Pipeline Constants
 * Centralized location for all magic numbers and constant values
 */

// Time constants
export const TIME_CONSTANTS = {
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  MILLISECONDS_PER_SECOND: 1000,
  get MILLISECONDS_PER_HOUR() {
    return (
      this.SECONDS_PER_MINUTE *
      this.MINUTES_PER_HOUR *
      this.MILLISECONDS_PER_SECOND
    );
  },
} as const;

// File size constants
export const FILE_CONSTANTS = {
  BYTES_PER_KB: 1024,
  KB_PER_MB: 1024,
  MAX_FILE_SIZE_MB: 10,
  get MAX_FILE_SIZE_BYTES() {
    return this.MAX_FILE_SIZE_MB * this.KB_PER_MB * this.BYTES_PER_KB;
  },
} as const;

// CSV processing constants
export const CSV_CONSTANTS = {
  HEADER_ROW_OFFSET: 2,
  MAX_PREVIEW_ROWS: 10,
  MAX_STRING_LENGTH: 200,
  MAX_PREVIEW_STRING_LENGTH: 100,
  VALIDATION_SAMPLE_SIZE: 50,
  MAX_SAMPLE_ITEMS: 5,
  MAX_ERROR_DISPLAY: 20,
  DEFAULT_BATCH_SIZE: 100,
} as const;

// Job cleanup constants
export const JOB_CONSTANTS = {
  DEFAULT_CLEANUP_HOURS: 24,
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 5000,
} as const;

// Validation constants
export const VALIDATION_CONSTANTS = {
  MIN_FIELD_LENGTH: 1,
  MAX_FIELD_LENGTH: 255,
  MAX_WARNINGS_DISPLAY: 10,
  MAX_ERRORS_DISPLAY: 20,
} as const;

// Asset status enum values
export const VALID_ASSET_STATUSES = [
  'ACTIVE',
  'INACTIVE',
  'MAINTENANCE',
  'DISPOSED',
  'PENDING',
  'RESERVED',
  'RETIRED',
] as const;

// Asset condition enum values
export const VALID_ASSET_CONDITIONS = [
  'NEW',
  'EXCELLENT',
  'GOOD',
  'FAIR',
  'POOR',
  'BROKEN',
  'UNKNOWN',
] as const;

// Required CSV headers
export const REQUIRED_CSV_HEADERS = ['Asset Tag', 'Asset Name'] as const;

// Optional CSV headers
export const OPTIONAL_CSV_HEADERS = [
  'Manufacturer',
  'Model',
  'Serial Number',
  'Status',
  'Condition',
  'Location',
  'Department',
  'Assigned To',
  'Purchase Date',
  'Purchase Price',
  'Warranty Expiration',
  'Notes',
] as const;

// Default values
export const DEFAULT_VALUES = {
  PROJECT_ID: '00000000-0000-0000-0000-000000000000',
  STATUS: 'ACTIVE',
  CONDITION: 'GOOD',
} as const;
