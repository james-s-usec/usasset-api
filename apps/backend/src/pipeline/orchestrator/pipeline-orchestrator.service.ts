import { Injectable, Logger } from '@nestjs/common';
import { PipelinePhase } from '@prisma/client';
import {
  PhaseProcessor,
  PhaseContext,
  PhaseResult,
} from './phase-processor.interface';
import { PipelineService } from '../pipeline.service';
import { PipelineRepository } from '../repositories/pipeline.repository';

export interface OrchestrationResult {
  success: boolean;
  jobId: string;
  correlationId: string;
  phases: PhaseResult[];
  totalDuration: number;
  summary: {
    totalRecords: number;
    successfulRecords: number;
    failedRecords: number;
    phasesCompleted: number;
    phasesSkipped: number;
  };
  error?: string;
}

interface PhaseInputData {
  fileId: string;
  [key: string]: unknown;
}

interface OrchestrationMetrics {
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
}

@Injectable()
export class PipelineOrchestrator {
  private readonly logger = new Logger(PipelineOrchestrator.name);
  private readonly processors = new Map<PipelinePhase, PhaseProcessor>();

  public constructor(
    private readonly legacyPipelineService: PipelineService,
    private readonly pipelineRepository: PipelineRepository,
  ) {}

  public registerProcessor(processor: PhaseProcessor): void {
    this.processors.set(processor.phase, processor);
    this.logger.debug(`Registered processor for phase: ${processor.phase}`);
  }

  public async orchestrateFile(fileId: string): Promise<OrchestrationResult> {
    const startTime = new Date();
    const orchestrationContext = this.initializeOrchestration(fileId);

    try {
      const { phases, metrics } = await this.executeAllPhases(
        orchestrationContext,
        startTime,
      );

      return this.buildSuccessResult(
        orchestrationContext,
        phases,
        metrics,
        startTime,
      );
    } catch (error) {
      return this.buildErrorResult(orchestrationContext, error, startTime);
    }
  }

  private initializeOrchestration(fileId: string): {
    correlationId: string;
    jobId: string;
    fileId: string;
  } {
    const correlationId = `orchestration-${Date.now()}`;
    const jobId = `job-${Date.now()}`;

    this.logger.log(
      `Starting orchestration for file ${fileId} with correlation ${correlationId}`,
    );

    return { correlationId, jobId, fileId };
  }

  private async executeAllPhases(
    orchestrationContext: {
      correlationId: string;
      jobId: string;
      fileId: string;
    },
    startTime: Date,
  ): Promise<{ phases: PhaseResult[]; metrics: OrchestrationMetrics }> {
    const phases: PhaseResult[] = [];
    const metrics = { totalRecords: 0, successfulRecords: 0, failedRecords: 0 };
    let currentData: PhaseInputData = { fileId: orchestrationContext.fileId };

    const pipelinePhases = this.getPipelinePhases();

    for (const phase of pipelinePhases) {
      const phaseResult = await this.executePhase(phase, currentData, {
        orchestrationContext,
        startTime,
        phases,
      });

      if (!phaseResult) continue;

      phases.push(phaseResult);
      this.updateMetrics(metrics, phaseResult);

      // Save phase result to database for traceability
      await this.savePhaseResult(orchestrationContext.jobId, phaseResult);

      if (this.shouldStopOrchestration(phaseResult, phase)) {
        break;
      }

      currentData = this.getNextPhaseData(phaseResult, currentData);
    }

    return { phases, metrics };
  }

  private getPipelinePhases(): PipelinePhase[] {
    return [
      PipelinePhase.EXTRACT,
      PipelinePhase.VALIDATE,
      PipelinePhase.CLEAN,
      PipelinePhase.TRANSFORM,
      PipelinePhase.MAP,
      PipelinePhase.LOAD,
    ];
  }

  private async executePhase(
    phase: PipelinePhase,
    currentData: PhaseInputData,
    executionContext: {
      orchestrationContext: {
        correlationId: string;
        jobId: string;
        fileId: string;
      };
      startTime: Date;
      phases: PhaseResult[];
    },
  ): Promise<PhaseResult | null> {
    const processor = this.processors.get(phase);
    if (!processor) {
      this.logger.warn(`No processor registered for phase: ${phase}, skipping`);
      return null;
    }

    const context = this.buildPhaseContext(
      executionContext.orchestrationContext,
      executionContext.startTime,
      phase,
      executionContext.phases,
    );

    return await processor.process(currentData, context);
  }

  private buildPhaseContext(
    orchestrationContext: {
      correlationId: string;
      jobId: string;
      fileId: string;
    },
    startTime: Date,
    phase: PipelinePhase,
    phases: PhaseResult[],
  ): PhaseContext {
    return {
      jobId: orchestrationContext.jobId,
      correlationId: orchestrationContext.correlationId,
      fileId: orchestrationContext.fileId,
      metadata: {
        orchestrationStart: startTime,
        currentPhase: phase,
        previousPhases: phases.map((p) => p.phase),
      },
    };
  }

  private updateMetrics(
    metrics: OrchestrationMetrics,
    phaseResult: PhaseResult,
  ): void {
    metrics.totalRecords = Math.max(
      metrics.totalRecords,
      phaseResult.metrics.recordsProcessed,
    );
    metrics.successfulRecords += phaseResult.metrics.recordsSuccess;
    metrics.failedRecords += phaseResult.metrics.recordsFailed;
  }

  private async savePhaseResult(
    jobId: string,
    phaseResult: PhaseResult,
  ): Promise<void> {
    try {
      const data = this.buildPhaseResultData(jobId, phaseResult);
      await this.pipelineRepository.savePhaseResult(data);
      this.logPhaseResultSaved(phaseResult, data.transformations);
    } catch (error) {
      this.handlePhaseResultError(phaseResult, error);
    }
  }

  private buildPhaseResultData(
    jobId: string,
    phaseResult: PhaseResult,
  ): {
    import_job_id: string;
    phase: PipelinePhase;
    status: string;
    transformations: unknown[];
    applied_rules: string[];
    input_sample?: unknown;
    output_sample?: unknown;
    rows_processed: number;
    rows_modified: number;
    rows_failed: number;
    metadata?: unknown;
    errors?: unknown;
    warnings?: unknown;
    started_at: Date;
    completed_at?: Date;
    duration_ms?: number;
  } {
    const transformations = this.extractTransformations(phaseResult);
    const appliedRules = this.extractAppliedRules(phaseResult);

    return {
      ...this.buildBasePhaseData(jobId, phaseResult),
      ...this.buildTransformationData(transformations, appliedRules),
      ...this.buildMetricsData(phaseResult, transformations.length),
      ...this.buildTimingData(phaseResult),
    };
  }

  private extractTransformations(phaseResult: PhaseResult): unknown[] {
    return phaseResult.debug?.transformations || [];
  }

  private extractAppliedRules(phaseResult: PhaseResult): string[] {
    return phaseResult.debug?.rulesApplied || [];
  }

  private buildBasePhaseData(
    jobId: string,
    phaseResult: PhaseResult,
  ): {
    import_job_id: string;
    phase: PipelinePhase;
    status: string;
    errors: string[];
    warnings: string[];
  } {
    return {
      import_job_id: jobId,
      phase: phaseResult.phase,
      status: phaseResult.success ? 'SUCCESS' : 'FAILED',
      errors: phaseResult.errors,
      warnings: phaseResult.warnings,
    };
  }

  private buildTransformationData(
    transformations: unknown[],
    appliedRules: string[],
  ): {
    transformations: unknown[];
    applied_rules: string[];
    input_sample: unknown;
    output_sample: unknown;
  } {
    return {
      transformations,
      applied_rules: appliedRules,
      input_sample: null, // TODO: Add sample data collection
      output_sample: null, // TODO: Add sample data collection
    };
  }

  private buildMetricsData(
    phaseResult: PhaseResult,
    transformationCount: number,
  ): {
    rows_processed: number;
    rows_modified: number;
    rows_failed: number;
    metadata: unknown;
  } {
    return {
      rows_processed: phaseResult.metrics?.recordsProcessed || 0,
      rows_modified: transformationCount,
      rows_failed: phaseResult.metrics?.recordsFailed || 0,
      metadata: {
        phase: phaseResult.phase,
        warnings: phaseResult.warnings,
      },
    };
  }

  private buildTimingData(phaseResult: PhaseResult): {
    started_at: Date;
    completed_at: Date;
    duration_ms: number;
  } {
    return {
      started_at: phaseResult.metrics?.startTime || new Date(),
      completed_at: phaseResult.metrics?.endTime || new Date(),
      duration_ms: phaseResult.metrics?.durationMs || 0,
    };
  }

  private logPhaseResultSaved(
    phaseResult: PhaseResult,
    transformations: unknown[],
  ): void {
    this.logger.debug(
      `Saved phase result for ${phaseResult.phase} with ${transformations.length} transformations`,
    );
  }

  private handlePhaseResultError(
    phaseResult: PhaseResult,
    error: unknown,
  ): void {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    this.logger.error(
      `Failed to save phase result for ${phaseResult.phase}: ${errorMessage}`,
    );
    // Don't throw - we don't want to stop the pipeline for tracking failures
  }

  private shouldStopOrchestration(
    phaseResult: PhaseResult,
    phase: PipelinePhase,
  ): boolean {
    if (!phaseResult.success && phaseResult.errors.length > 0) {
      this.logger.error(
        `Phase ${phase} failed critically, stopping orchestration`,
      );
      return true;
    }
    return false;
  }

  private getNextPhaseData(
    phaseResult: PhaseResult,
    currentData: PhaseInputData,
  ): PhaseInputData {
    return phaseResult.data !== undefined
      ? (phaseResult.data as PhaseInputData)
      : currentData;
  }

  private buildSuccessResult(
    orchestrationContext: { correlationId: string; jobId: string },
    phases: PhaseResult[],
    metrics: OrchestrationMetrics,
    startTime: Date,
  ): OrchestrationResult {
    const endTime = new Date();
    const totalDuration = endTime.getTime() - startTime.getTime();
    const overallSuccess = phases.length > 0 && phases.every((p) => p.success);
    const pipelinePhases = this.getPipelinePhases();

    const result: OrchestrationResult = {
      success: overallSuccess,
      jobId: orchestrationContext.jobId,
      correlationId: orchestrationContext.correlationId,
      phases,
      totalDuration,
      summary: {
        totalRecords: metrics.totalRecords,
        successfulRecords: metrics.successfulRecords,
        failedRecords: metrics.failedRecords,
        phasesCompleted: phases.filter((p) => p.success).length,
        phasesSkipped: pipelinePhases.length - phases.length,
      },
    };

    this.logger.log(
      `Orchestration completed in ${totalDuration}ms. Success: ${overallSuccess}`,
    );

    return result;
  }

  private buildErrorResult(
    orchestrationContext: { correlationId: string; jobId: string },
    error: unknown,
    startTime: Date,
  ): OrchestrationResult {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.logger.error(`Orchestration failed: ${errorMessage}`);

    const endTime = new Date();
    const pipelinePhases = this.getPipelinePhases();

    return {
      success: false,
      jobId: orchestrationContext.jobId,
      correlationId: orchestrationContext.correlationId,
      phases: [],
      totalDuration: endTime.getTime() - startTime.getTime(),
      summary: {
        totalRecords: 0,
        successfulRecords: 0,
        failedRecords: 0,
        phasesCompleted: 0,
        phasesSkipped: pipelinePhases.length,
      },
      error: errorMessage,
    };
  }

  public async testAllPhases(): Promise<OrchestrationResult> {
    this.logger.log('Running tracer bullet test for all phases');

    // Use test data instead of real file
    const testFileId = 'test-file-123';
    return this.orchestrateFile(testFileId);
  }

  public getRegisteredProcessors(): Array<{
    phase: PipelinePhase;
    name: string;
    description: string;
  }> {
    return Array.from(this.processors.values()).map((p) => ({
      phase: p.phase,
      name: p.name,
      description: p.description,
    }));
  }
}
