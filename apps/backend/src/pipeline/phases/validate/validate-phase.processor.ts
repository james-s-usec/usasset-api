import { Injectable, Logger } from '@nestjs/common';
import { PipelinePhase } from '@prisma/client';
import {
  PhaseProcessor,
  PhaseContext,
  PhaseResult,
} from '../../orchestrator/phase-processor.interface';

@Injectable()
export class ValidatePhaseProcessor implements PhaseProcessor {
  public readonly phase = PipelinePhase.VALIDATE;
  public readonly name = 'Data Validator';
  public readonly description =
    'Validates required fields, data types, and business rules';

  private readonly logger = new Logger(ValidatePhaseProcessor.name);

  public async process(data: any, context: PhaseContext): Promise<PhaseResult> {
    const startTime = new Date();
    this.logger.debug(`[${context.correlationId}] Starting VALIDATE phase`);

    try {
      if (!data.rows || !Array.isArray(data.rows)) {
        throw new Error(
          'Invalid input: expected rows array from EXTRACT phase',
        );
      }

      const validatedData = {
        ...data,
        validationResults: [],
      };

      const validRows = [];
      const invalidRows = [];
      const transformations = [];

      // Validate each row
      for (let i = 0; i < data.rows.length; i++) {
        const row = data.rows[i];
        const rowErrors = [];
        const rowWarnings = [];

        // Required field validation
        if (!row['Asset Tag'] || row['Asset Tag'].trim() === '') {
          rowErrors.push('Asset Tag is required');
        }

        if (!row['Asset Name'] || row['Asset Name'].trim() === '') {
          rowErrors.push('Asset Name is required');
        }

        // Data type validation
        const assetTag = row['Asset Tag'];
        if (assetTag && typeof assetTag !== 'string') {
          rowErrors.push('Asset Tag must be a string');
        }

        // Business rule validation
        const status = row['Status']?.toLowerCase();
        const validStatuses = ['active', 'inactive', 'maintenance', 'retired'];
        if (status && !validStatuses.includes(status)) {
          rowWarnings.push(
            `Status "${row['Status']}" will be mapped to default "ACTIVE"`,
          );
        }

        const validationResult = {
          rowNumber: i + 1,
          isValid: rowErrors.length === 0,
          errors: rowErrors,
          warnings: rowWarnings,
          originalData: row,
        };

        validatedData.validationResults.push(validationResult);

        if (validationResult.isValid) {
          validRows.push(row);
        } else {
          invalidRows.push({ ...row, _validationErrors: rowErrors });
        }

        // Track transformations
        transformations.push({
          field: `row_${i + 1}`,
          before: 'raw CSV data',
          after: validationResult.isValid
            ? 'valid'
            : `invalid (${rowErrors.length} errors)`,
        });
      }

      validatedData.validRows = validRows;
      validatedData.invalidRows = invalidRows;

      const endTime = new Date();
      const durationMs = endTime.getTime() - startTime.getTime();
      const recordsProcessed = data.rows.length;
      const recordsSuccess = validRows.length;
      const recordsFailed = invalidRows.length;

      this.logger.debug(
        `[${context.correlationId}] VALIDATE phase completed: ${recordsSuccess}/${recordsProcessed} valid records in ${durationMs}ms`,
      );

      return {
        success: true,
        phase: this.phase,
        data: validatedData,
        errors: [],
        warnings:
          recordsFailed > 0 ? [`${recordsFailed} rows failed validation`] : [],
        metrics: {
          startTime,
          endTime,
          durationMs,
          recordsProcessed,
          recordsSuccess,
          recordsFailed,
        },
        debug: {
          validationResults: {
            validRows: recordsSuccess,
            invalidRows: recordsFailed,
            totalErrors: validatedData.validationResults.reduce(
              (sum: number, r: any) => sum + r.errors.length,
              0,
            ),
            totalWarnings: validatedData.validationResults.reduce(
              (sum: number, r: any) => sum + r.warnings.length,
              0,
            ),
          },
          transformations,
        },
      };
    } catch (error) {
      const endTime = new Date();
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(
        `[${context.correlationId}] VALIDATE phase failed: ${errorMessage}`,
      );

      return {
        success: false,
        phase: this.phase,
        data: data,
        errors: [`VALIDATE failed: ${errorMessage}`],
        warnings: [],
        metrics: {
          startTime,
          endTime,
          durationMs: endTime.getTime() - startTime.getTime(),
          recordsProcessed: 0,
          recordsSuccess: 0,
          recordsFailed: 1,
        },
      };
    }
  }
}
