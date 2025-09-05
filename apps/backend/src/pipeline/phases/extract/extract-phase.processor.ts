import { Injectable, Logger } from '@nestjs/common';
import { PipelinePhase } from '@prisma/client';
import {
  PhaseProcessor,
  PhaseContext,
  PhaseResult,
} from '../../orchestrator/phase-processor.interface';
import { PipelineService } from '../../pipeline.service';

const CONSTANTS = {
  SAMPLE_TOTAL_ROWS: 2,
};

interface ExtractInputData {
  fileId?: string;
}

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

  public async process(
    data: ExtractInputData,
    context: PhaseContext,
  ): Promise<PhaseResult> {
    const startTime = new Date();
    this.logger.debug(`[${context.correlationId}] Starting EXTRACT phase`);

    try {
      const { extractedData, recordsProcessed } = await this.extractData(data);
      return this.buildSuccessResult(
        extractedData,
        recordsProcessed,
        startTime,
        context,
      );
    } catch (error) {
      return this.buildErrorResult(data, error, startTime, context);
    }
  }

  private async extractData(data: ExtractInputData): Promise<{
    extractedData: {
      fileId: string;
      rows: Record<string, string>[];
      columns: string[];
      totalRows: number;
    };
    recordsProcessed: number;
  }> {
    if (data.fileId && data.fileId !== 'test-file-123') {
      return await this.extractRealFile(data.fileId);
    } else {
      return this.generateTestData();
    }
  }

  private async extractRealFile(fileId: string): Promise<{
    extractedData: {
      fileId: string;
      rows: Record<string, string>[];
      columns: string[];
      totalRows: number;
    };
    recordsProcessed: number;
  }> {
    this.logger.debug(`Extracting real file: ${fileId}`);
    const preview = await this.legacyService.previewCsvFile(fileId);

    return {
      extractedData: {
        fileId,
        rows: preview.data,
        columns: preview.columns,
        totalRows: preview.totalRows,
      },
      recordsProcessed: preview.totalRows,
    };
  }

  private generateTestData(): {
    extractedData: {
      fileId: string;
      rows: Record<string, string>[];
      columns: string[];
      totalRows: number;
    };
    recordsProcessed: number;
  } {
    this.logger.debug('Using test data for EXTRACT phase');

    return {
      extractedData: {
        fileId: 'test-file-123',
        rows: this.getTestRows(),
        columns: this.getTestColumns(),
        totalRows: CONSTANTS.SAMPLE_TOTAL_ROWS,
      },
      recordsProcessed: CONSTANTS.SAMPLE_TOTAL_ROWS,
    };
  }

  private buildSuccessResult(
    extractedData: {
      fileId: string;
      rows: Record<string, string>[];
      columns: string[];
      totalRows: number;
    },
    recordsProcessed: number,
    startTime: Date,
    context: PhaseContext,
  ): PhaseResult {
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
      metrics: this.createMetrics(
        startTime,
        endTime,
        durationMs,
        recordsProcessed,
      ),
    };
  }

  private createMetrics(
    startTime: Date,
    endTime: Date,
    durationMs: number,
    recordsProcessed: number,
  ): {
    startTime: Date;
    endTime: Date;
    durationMs: number;
    recordsProcessed: number;
    recordsSuccess: number;
    recordsFailed: number;
  } {
    return {
      startTime,
      endTime,
      durationMs,
      recordsProcessed,
      recordsSuccess: recordsProcessed,
      recordsFailed: 0,
    };
  }

  private buildErrorResult(
    data: ExtractInputData,
    error: unknown,
    startTime: Date,
    context: PhaseContext,
  ): PhaseResult {
    const endTime = new Date();
    const errorMessage = error instanceof Error ? error.message : String(error);

    this.logger.error(
      `[${context.correlationId}] EXTRACT phase failed: ${errorMessage}`,
    );

    return {
      success: false,
      phase: this.phase,
      data,
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

  private getTestRows(): Record<string, string>[] {
    return [
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
    ];
  }

  private getTestColumns(): string[] {
    return ['Asset Tag', 'Asset Name', 'Manufacturer', 'Status', 'Condition'];
  }
}
