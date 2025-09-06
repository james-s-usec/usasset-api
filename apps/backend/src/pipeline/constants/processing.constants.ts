export const PROCESSING_CONSTANTS = {
  // Batch processing
  DEFAULT_BATCH_SIZE: 10,
  LARGE_BATCH_SIZE: 100,

  // Error handling
  MAX_ERRORS_DISPLAY: 20,
  MAX_WARNING_DISPLAY_LIMIT: 10,
  MAX_ERROR_DISPLAY_LIMIT: 20,

  // Sampling and debugging
  MAX_SAMPLE_SIZE: 5,
  MAX_DEBUG_TRANSFORMATIONS: 10,
  SAMPLE_SIZE_DEFAULT: 3,

  // Field validation
  MAX_MANUFACTURER_LENGTH: 100,

  // File processing
  MAX_FILES_DISPLAY: 100,
  HEADER_ROW_OFFSET: 2,
  DATE_STRING_LENGTH: 10,

  // Parsing
  TIMEOUT_MS: 120000,
  CHUNK_SIZE: 1000,
} as const;

export type ProcessingConstant = keyof typeof PROCESSING_CONSTANTS;
