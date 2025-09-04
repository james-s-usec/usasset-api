import { Injectable, Logger } from '@nestjs/common';
import { PipelinePhase } from '@prisma/client';
import {
  PhaseProcessor,
  PhaseContext,
  PhaseResult,
} from '../../orchestrator/phase-processor.interface';

@Injectable()
export class MapPhaseProcessor implements PhaseProcessor {
  public readonly phase = PipelinePhase.MAP;
  public readonly name = 'Schema Mapper';
  public readonly description =
    'Maps CSV fields to database schema: FIELD_MAPPING, ENUM_MAPPING, etc.';

  private readonly logger = new Logger(MapPhaseProcessor.name);

  public async process(data: any, context: PhaseContext): Promise<PhaseResult> {
    const startTime = new Date();
    this.logger.debug(`[${context.correlationId}] Starting MAP phase`);

    try {
      const sourceRows =
        data.transformedRows || data.cleanedRows || data.validRows || data.rows;
      if (!sourceRows || !Array.isArray(sourceRows)) {
        throw new Error(
          'Invalid input: expected rows array from previous phase',
        );
      }

      const mappedData = {
        ...data,
        mappedRows: [],
      };

      const transformations = [];

      // PLACEHOLDER: Map CSV columns to database schema
      const fieldMappings = {
        'Asset Tag': 'assetTag',
        'Asset Name': 'name',
        Manufacturer: 'manufacturer',
        Status: 'status',
        Condition: 'condition',
      };

      const statusEnumMapping = {
        ACTIVE: 'ACTIVE',
        INACTIVE: 'INACTIVE',
        MAINTENANCE: 'MAINTENANCE',
        RETIRED: 'RETIRED',
      };

      const conditionEnumMapping = {
        GOOD: 'GOOD',
        FAIR: 'FAIR',
        POOR: 'POOR',
        EXCELLENT: 'EXCELLENT',
      };

      for (let i = 0; i < sourceRows.length; i++) {
        const row = sourceRows[i];
        const mappedRow: any = {};

        // Map CSV fields to database fields
        Object.entries(fieldMappings).forEach(([csvField, dbField]) => {
          if (row[csvField] !== undefined) {
            mappedRow[dbField] = row[csvField];

            transformations.push({
              field: `${csvField}_row_${i + 1}`,
              before: `CSV: "${csvField}"`,
              after: `DB: "${dbField}"`,
            });
          }
        });

        // Map status enum values
        if (mappedRow.status) {
          const originalStatus = mappedRow.status;
          const mappedStatus =
            statusEnumMapping[
              originalStatus.toUpperCase() as keyof typeof statusEnumMapping
            ] || 'ACTIVE';

          if (originalStatus !== mappedStatus) {
            transformations.push({
              field: `status_enum_row_${i + 1}`,
              before: originalStatus,
              after: mappedStatus,
            });
          }

          mappedRow.status = mappedStatus;
        }

        // Map condition enum values
        if (mappedRow.condition) {
          const originalCondition = mappedRow.condition;
          const mappedCondition =
            conditionEnumMapping[
              originalCondition.toUpperCase() as keyof typeof conditionEnumMapping
            ] || 'GOOD';

          if (originalCondition !== mappedCondition) {
            transformations.push({
              field: `condition_enum_row_${i + 1}`,
              before: originalCondition,
              after: mappedCondition,
            });
          }

          mappedRow.condition = mappedCondition;
        }

        // Add default/calculated database fields
        mappedRow.id = `generated-uuid-${i + 1}`; // Placeholder UUID
        mappedRow.created_at = new Date().toISOString();
        mappedRow.updated_at = new Date().toISOString();

        mappedData.mappedRows.push(mappedRow);
      }

      const endTime = new Date();
      const durationMs = endTime.getTime() - startTime.getTime();
      const recordsProcessed = sourceRows.length;

      this.logger.debug(
        `[${context.correlationId}] MAP phase completed: ${recordsProcessed} records mapped in ${durationMs}ms`,
      );

      return {
        success: true,
        phase: this.phase,
        data: mappedData,
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
            'FIELD_MAPPING',
            'ENUM_MAPPING (status)',
            'ENUM_MAPPING (condition)',
          ],
          transformations,
        },
      };
    } catch (error) {
      const endTime = new Date();
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(
        `[${context.correlationId}] MAP phase failed: ${errorMessage}`,
      );

      return {
        success: false,
        phase: this.phase,
        data: data,
        errors: [`MAP failed: ${errorMessage}`],
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
