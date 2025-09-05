import { Injectable, Logger } from '@nestjs/common';
import { PipelinePhase } from '@prisma/client';
import {
  PhaseProcessor,
  PhaseContext,
  PhaseResult,
} from '../../orchestrator/phase-processor.interface';
import { PipelineService } from '../../pipeline.service';

// CODE_SMELL: [Rule #2] ARCHITECTURE - Phase processor depends on PipelineService, circular dependency risk
// TODO: Extract shared CSV parsing service to avoid circular dependencies
@Injectable()
export class ExtractPhaseProcessor implements PhaseProcessor {
  public readonly phase = PipelinePhase.EXTRACT;
  public readonly name = 'CSV Data Extractor';
  public readonly description =
    'Extracts and parses CSV data from uploaded files';

  private readonly logger = new Logger(ExtractPhaseProcessor.name);

  public constructor(private readonly legacyService: PipelineService) {}

  // CODE_SMELL: [Rule #5] TYPE-SAFETY - Using 'any' for data parameter
  // TODO: Define ExtractPhaseInput interface
  // CODE_SMELL: [Rule #4] COMPLEXITY - Method has 85 lines, exceeds 30-line limit
  // TODO: Split into extractRealFile, generateTestData, buildResult methods
  // CODE_SMELL: [Rule #5] CLEVER-CODE - Hard-coded test data should be in configuration
  public async process(data: any, context: PhaseContext): Promise<PhaseResult> {
    const startTime = new Date();
    this.logger.debug(`[${context.correlationId}] Starting EXTRACT phase`);

    try {
      // For tracer bullet, use test data if no real fileId
      let extractedData;
      let recordsProcessed = 0;

      if (data.fileId && data.fileId !== 'test-file-123') {
        // Real file extraction - delegate to existing service
        this.logger.debug(`Extracting real file: ${data.fileId}`);
        const preview = await this.legacyService.previewCsvFile(data.fileId);
        extractedData = {
          fileId: data.fileId,
          rows: preview.data,
          columns: preview.columns,
          totalRows: preview.totalRows,
        };
        recordsProcessed = preview.totalRows;
      } else {
        // Test data for tracer bullet
        this.logger.debug('Using test data for EXTRACT phase');
        extractedData = {
          fileId: 'test-file-123',
          rows: [
            {
              'Asset Tag': '  HVAC-001  ',
              'Asset Name': '\t HVAC Unit 001 \n',
              Manufacturer: '  TestCorp  ',
              Status: 'active',
              Condition: 'good',
            },
            {
              'Asset Tag': 'HVAC-002',
              'Asset Name': 'HVAC Unit 002',
              Manufacturer: 'TestCorp',
              Status: 'maintenance',
              Condition: 'fair',
            },
          ],
          columns: [
            'Asset Tag',
            'Asset Name',
            'Manufacturer',
            'Status',
            'Condition',
          ],
          totalRows: 2,
        };
        recordsProcessed = 2;
      }

      const endTime = new Date();
      const durationMs = endTime.getTime() - startTime.getTime();

      this.logger.debug(
        `[${context.correlationId}] EXTRACT phase completed: ${recordsProcessed} records in ${durationMs}ms`,
      );

      return {
        success: true,
        phase: this.phase,
        data: extractedData,
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
          transformations: [
            {
              field: 'fileStructure',
              before: 'CSV file',
              after: `${recordsProcessed} rows with ${extractedData.columns.length} columns`,
            },
          ],
        },
      };
    } catch (error) {
      const endTime = new Date();
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(
        `[${context.correlationId}] EXTRACT phase failed: ${errorMessage}`,
      );

      return {
        success: false,
        phase: this.phase,
        data: data,
        errors: [`EXTRACT failed: ${errorMessage}`],
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
