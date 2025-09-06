export class PhaseValidators {
  public static validateRowsInput(data: Record<string, unknown>): void {
    if (!data.validRows || !Array.isArray(data.validRows)) {
      throw new Error(
        'Invalid input: expected validRows array from previous phase',
      );
    }
  }

  public static validateSourceRowsInput(data: Record<string, unknown>): void {
    if (!data.sourceRows || !Array.isArray(data.sourceRows)) {
      throw new Error(
        'Invalid input: expected sourceRows array from previous phase',
      );
    }
  }

  public static validateNonEmptyInput(data: Record<string, unknown>): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid input: expected data object');
    }
  }

  public static validatePhaseContext(context: {
    correlationId?: string;
    jobId?: string;
  }): void {
    if (!context.correlationId) {
      throw new Error('Missing correlationId in phase context');
    }
    if (!context.jobId) {
      throw new Error('Missing jobId in phase context');
    }
  }

  public static validateRuleConfiguration(config: unknown): void {
    if (!config || typeof config !== 'object') {
      throw new Error('Invalid rule configuration: expected object');
    }
  }

  public static validateArrayNotEmpty<T>(array: T[], itemName: string): void {
    if (!Array.isArray(array) || array.length === 0) {
      throw new Error(`No ${itemName} found to process`);
    }
  }

  public static validateStringNotEmpty(
    value: unknown,
    fieldName: string,
  ): asserts value is string {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new Error(`${fieldName} must be a non-empty string`);
    }
  }

  public static validateNumberRange(
    value: number,
    fieldName: string,
    min: number,
    max: number,
  ): void {
    if (typeof value !== 'number' || value < min || value > max) {
      throw new Error(
        `${fieldName} must be a number between ${min} and ${max}`,
      );
    }
  }

  public static validateFileId(fileId: unknown): asserts fileId is string {
    this.validateStringNotEmpty(fileId, 'fileId');
    // Add UUID validation if needed
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        fileId,
      )
    ) {
      throw new Error('fileId must be a valid UUID');
    }
  }
}
