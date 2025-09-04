import { Injectable, Logger } from '@nestjs/common';
import { PipelinePhase } from '@prisma/client';
import {
  PhaseProcessor,
  PhaseContext,
  PhaseResult,
} from '../../orchestrator/phase-processor.interface';

@Injectable()
export class TransformPhaseProcessor implements PhaseProcessor {
  public readonly phase = PipelinePhase.TRANSFORM;
  public readonly name = 'Data Transformer';
  public readonly description =
    'Transforms data: TO_UPPERCASE, DATE_FORMAT, CALCULATE_FIELD, etc.';

  private readonly logger = new Logger(TransformPhaseProcessor.name);

  public async process(data: any, context: PhaseContext): Promise<PhaseResult> {
    const startTime = new Date();
    this.logger.debug(`[${context.correlationId}] Starting TRANSFORM phase`);

    try {
      const sourceRows = data.cleanedRows || data.validRows || data.rows;
      if (!sourceRows || !Array.isArray(sourceRows)) {
        throw new Error(
          'Invalid input: expected rows array from previous phase',
        );
      }

      const transformedData = {
        ...data,
        transformedRows: [],
      };

      const transformations = [];

      // Process each row through transformation rules
      for (let i = 0; i < sourceRows.length; i++) {
        const row = sourceRows[i];
        const transformedRow = { ...row };

        // PLACEHOLDER: Apply basic transformations

        // Convert status to uppercase (business rule)
        if (transformedRow['Status']) {
          const original = transformedRow['Status'];
          const transformed = original.toString().toUpperCase();

          if (original !== transformed) {
            transformations.push({
              field: `Status_row_${i + 1}`,
              before: original,
              after: transformed,
            });
          }

          transformedRow['Status'] = transformed;
        }

        // Add calculated fields (placeholder)
        transformedRow['_processedAt'] = new Date().toISOString();
        transformedRow['_rowIndex'] = i + 1;

        transformations.push({
          field: `calculated_fields_row_${i + 1}`,
          before: 'none',
          after: 'added _processedAt and _rowIndex',
        });

        transformedData.transformedRows.push(transformedRow);
      }

      const endTime = new Date();
      const durationMs = endTime.getTime() - startTime.getTime();
      const recordsProcessed = sourceRows.length;

      this.logger.debug(
        `[${context.correlationId}] TRANSFORM phase completed: ${recordsProcessed} records transformed in ${durationMs}ms`,
      );

      return {
        success: true,
        phase: this.phase,
        data: transformedData,
        errors: [],
        warnings: [],
        metrics: {
          startTime,
          endTime,
          durationMs,
          recordsProcessed,
          recordsSuccess: recordsProcessed,
          recordsFailed: 0,
        },
        debug: {
          rulesApplied: [
            'TO_UPPERCASE (Status)',
            'CALCULATE_FIELD (timestamps)',
          ],
          transformations,
        },
      };
    } catch (error) {
      const endTime = new Date();
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(
        `[${context.correlationId}] TRANSFORM phase failed: ${errorMessage}`,
      );

      return {
        success: false,
        phase: this.phase,
        data: data,
        errors: [`TRANSFORM failed: ${errorMessage}`],
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
