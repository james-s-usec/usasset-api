import { Injectable, Logger } from '@nestjs/common';
import { PipelinePhase } from '@prisma/client';
import {
  PhaseProcessor,
  PhaseContext,
  PhaseResult,
} from './phase-processor.interface';
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

interface OrchestrationMetrics {
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  phasesCompleted: number;
  phasesSkipped: number;
}

interface OrchestrationContext {
  correlationId: string;
  jobId: string;
  fileId: string;
}

interface PhaseInputData {
  fileId: string;
  [key: string]: unknown;
}

interface PhaseResultData {
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
}

@Injectable()
export class PipelineOrchestrator {
  private readonly logger = new Logger(PipelineOrchestrator.name);
  private readonly processors = new Map<PipelinePhase, PhaseProcessor>();

  public constructor(private readonly pipelineRepository: PipelineRepository) {}

  public registerProcessor(processor: PhaseProcessor): void {
    this.processors.set(processor.phase, processor);
    this.logger.debug(`Registered processor for phase: ${processor.phase}`);
  }

  public async orchestrateFile(
    fileId: string,
    jobId?: string,
  ): Promise<OrchestrationResult> {
    const startTime = new Date();
    this.logger.warn(`🔥 ORCHESTRATOR START: fileId=${fileId}, jobId=${jobId}`);

    const orchestrationContext = this.initializeOrchestrationSafely(
      fileId,
      jobId,
    );
    return this.executeOrchestration(orchestrationContext, startTime);
  }

  private initializeOrchestrationSafely(
    fileId: string,
    jobId?: string,
  ): OrchestrationContext {
    try {
      const context = this.initializeOrchestration(fileId, jobId);
      this.logger.warn(
        `🔥 ORCHESTRATOR INITIALIZED: correlationId=${context.correlationId}`,
      );
      return context;
    } catch (error) {
      this.logger.error(`🔥 ORCHESTRATOR INIT FAILED:`, error);
      throw error;
    }
  }

  private async executeOrchestration(
    orchestrationContext: OrchestrationContext,
    startTime: Date,
  ): Promise<OrchestrationResult> {
    try {
      this.logger.warn(`🔥 ORCHESTRATOR EXECUTING PHASES...`);
      const { phases, metrics } = await this.executeAllPhases(
        orchestrationContext,
        startTime,
      );
      this.logger.warn(
        `🔥 ORCHESTRATOR PHASES COMPLETE: ${phases.length} phases`,
      );

      const result = this.buildSuccessResult(
        orchestrationContext,
        phases,
        metrics,
        startTime,
      );
      this.logger.warn(`🔥 ORCHESTRATOR SUCCESS`);
      return result;
    } catch (error) {
      this.logger.error(`🔥 ORCHESTRATOR ERROR:`, error);
      return this.buildErrorResult(orchestrationContext, error, startTime);
    }
  }

  private initializeOrchestration(
    fileId: string,
    providedJobId?: string,
  ): OrchestrationContext {
    const correlationId = `orchestration-${Date.now()}`;
    const jobId = providedJobId || `job-${Date.now()}`;

    this.logger.log(
      `Starting orchestration for file ${fileId} with job ${jobId} and correlation ${correlationId}`,
    );

    return { correlationId, jobId, fileId };
  }

  private async executeAllPhases(
    orchestrationContext: OrchestrationContext,
    startTime: Date,
  ): Promise<{ phases: PhaseResult[]; metrics: OrchestrationMetrics }> {
    const phases: PhaseResult[] = [];
    const metrics = this.initializeMetrics();
    let currentData: PhaseInputData = { fileId: orchestrationContext.fileId };

    const pipelinePhases = this.getPipelinePhases();

    for (const phase of pipelinePhases) {
      const phaseResult = await this.executePhase(phase, currentData, {
        orchestrationContext,
        startTime,
        phases,
      });

      if (!phaseResult) continue;

      const shouldContinue = await this.processPhaseResult(
        phaseResult,
        phases,
        metrics,
        orchestrationContext.jobId,
      );

      if (!shouldContinue) break;

      currentData = this.getNextPhaseData(phaseResult, currentData);
    }

    return { phases, metrics };
  }

  private initializeMetrics(): OrchestrationMetrics {
    return {
      totalRecords: 0,
      successfulRecords: 0,
      failedRecords: 0,
      phasesCompleted: 0,
      phasesSkipped: 0,
    };
  }

  private async processPhaseResult(
    phaseResult: PhaseResult,
    phases: PhaseResult[],
    metrics: OrchestrationMetrics,
    jobId: string,
  ): Promise<boolean> {
    phases.push(phaseResult);
    this.updateMetrics(metrics, phaseResult);

    // Save phase result to database for traceability
    await this.savePhaseResult(jobId, phaseResult);

    return !this.shouldStopOrchestration(phaseResult);
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
    // Increment phases completed counter
    metrics.phasesCompleted += 1;
  }

  private async savePhaseResult(
    jobId: string,
    phaseResult: PhaseResult,
  ): Promise<void> {
    try {
      const data = this.buildPhaseResultData(jobId, phaseResult);
      await this.pipelineRepository.savePhaseResult(data);
      this.logPhaseResultSaved(jobId, phaseResult.phase);
    } catch (error) {
      this.handlePhaseResultError(error, jobId, phaseResult.phase);
    }
  }

  private buildPhaseResultData(
    jobId: string,
    phaseResult: PhaseResult,
  ): PhaseResultData {
    const transformations = this.extractTransformations(phaseResult);
    const appliedRules = this.extractAppliedRules(phaseResult);

    return {
      ...this.buildBasePhaseData(jobId, phaseResult),
      ...this.buildTransformationDataSection(
        transformations,
        appliedRules,
        phaseResult,
      ),
      ...this.buildMetricsDataSection(phaseResult, transformations.length),
      ...this.buildTimingDataSection(phaseResult),
    };
  }

  private buildTransformationDataSection(
    transformations: unknown[],
    appliedRules: string[],
    phaseResult: PhaseResult,
  ): {
    transformations: unknown[];
    applied_rules: string[];
    input_sample?: unknown;
    output_sample?: unknown;
  } {
    return this.getTransformationData(
      transformations,
      appliedRules,
      phaseResult,
    );
  }

  private buildMetricsDataSection(
    phaseResult: PhaseResult,
    transformationCount: number,
  ): {
    rows_processed: number;
    rows_modified: number;
    rows_failed: number;
    metadata?: unknown;
    errors: unknown[];
    warnings: unknown[];
  } {
    return this.getMetricsData(phaseResult, transformationCount);
  }

  private buildTimingDataSection(phaseResult: PhaseResult): {
    started_at: Date;
    completed_at?: Date;
    duration_ms?: number;
  } {
    return this.getTimingData(phaseResult);
  }

  private getTransformationData(
    transformations: unknown[],
    appliedRules: string[],
    phaseResult: PhaseResult,
  ): {
    transformations: unknown[];
    applied_rules: string[];
    input_sample?: unknown;
    output_sample?: unknown;
  } {
    return this.buildTransformationDataHelper(
      transformations,
      appliedRules,
      phaseResult,
    );
  }

  private getMetricsData(
    phaseResult: PhaseResult,
    transformationCount: number,
  ): {
    rows_processed: number;
    rows_modified: number;
    rows_failed: number;
    metadata?: unknown;
    errors: unknown[];
    warnings: unknown[];
  } {
    return this.buildMetricsDataHelper(phaseResult, transformationCount);
  }

  private getTimingData(phaseResult: PhaseResult): {
    started_at: Date;
    completed_at?: Date;
    duration_ms?: number;
  } {
    return this.buildTimingDataHelper(phaseResult);
  }

  private buildTransformationDataHelper(
    transformations: unknown[],
    appliedRules: string[],
    phaseResult: PhaseResult,
  ): {
    transformations: unknown[];
    applied_rules: string[];
    input_sample?: unknown;
    output_sample?: unknown;
  } {
    return this.buildTransformationData(
      transformations,
      appliedRules,
      phaseResult,
    );
  }

  private buildMetricsDataHelper(
    phaseResult: PhaseResult,
    transformationCount: number,
  ): {
    rows_processed: number;
    rows_modified: number;
    rows_failed: number;
    metadata?: unknown;
    errors: unknown[];
    warnings: unknown[];
  } {
    return this.buildMetricsData(phaseResult, transformationCount);
  }

  private buildTimingDataHelper(phaseResult: PhaseResult): {
    started_at: Date;
    completed_at?: Date;
    duration_ms?: number;
  } {
    return this.buildTimingData(phaseResult);
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
  } {
    return {
      import_job_id: jobId,
      phase: phaseResult.phase,
      status: phaseResult.success ? 'SUCCESS' : 'FAILED',
    };
  }

  private buildTransformationData(
    transformations: unknown[],
    appliedRules: string[],
    phaseResult: PhaseResult,
  ): {
    transformations: unknown[];
    applied_rules: string[];
    input_sample?: unknown;
    output_sample?: unknown;
  } {
    const samples = this.extractSamples(phaseResult);
    return {
      transformations,
      applied_rules: appliedRules,
      input_sample: samples.inputSample,
      output_sample: samples.outputSample,
    };
  }

  private buildMetricsData(
    phaseResult: PhaseResult,
    transformationCount: number,
  ): {
    rows_processed: number;
    rows_modified: number;
    rows_failed: number;
    metadata?: unknown;
    errors: unknown[];
    warnings: unknown[];
  } {
    return {
      rows_processed: phaseResult.metrics?.recordsProcessed || 0,
      rows_modified: transformationCount,
      rows_failed: phaseResult.metrics?.recordsFailed || 0,
      metadata: phaseResult.debug,
      errors: phaseResult.errors || [],
      warnings: phaseResult.warnings || [],
    };
  }

  private buildTimingData(phaseResult: PhaseResult): {
    started_at: Date;
    completed_at?: Date;
    duration_ms?: number;
  } {
    const startTime = phaseResult.metrics?.startTime || new Date();
    const endTime = phaseResult.metrics?.endTime;
    return {
      started_at: startTime,
      completed_at: endTime,
      duration_ms: phaseResult.metrics?.durationMs || 0,
    };
  }

  private extractSamples(phaseResult: PhaseResult): {
    inputSample: unknown;
    outputSample: unknown;
  } {
    // First check if samples are directly provided in debug
    if (phaseResult.debug?.samples) {
      return {
        inputSample: this.limitSampleSize(phaseResult.debug.samples.input),
        outputSample: this.limitSampleSize(phaseResult.debug.samples.output),
      };
    }

    // Derive samples based on phase type and available data
    return this.deriveSamplesFromData(phaseResult);
  }

  private deriveSamplesFromData(phaseResult: PhaseResult): {
    inputSample: unknown;
    outputSample: unknown;
  } {
    const data = phaseResult.data as Record<string, unknown>;

    switch (phaseResult.phase) {
      case 'EXTRACT':
        return this.deriveExtractSamples(data);
      case 'VALIDATE':
        return this.deriveValidateSamples(data);
      case 'CLEAN':
        return this.deriveCleanSamples(data);
      case 'TRANSFORM':
      case 'MAP':
        return this.deriveTransformSamples(data);
      case 'LOAD':
        return this.deriveLoadSamples(data);
      default:
        return { inputSample: null, outputSample: null };
    }
  }

  private deriveExtractSamples(data: Record<string, unknown>): {
    inputSample: unknown;
    outputSample: unknown;
  } {
    const rows = data.rows as unknown[];
    return {
      inputSample: null, // Raw CSV input not available at this level
      outputSample: this.limitSampleSize(rows),
    };
  }

  private deriveValidateSamples(data: Record<string, unknown>): {
    inputSample: unknown;
    outputSample: unknown;
  } {
    const inputRows = data.rows as unknown[];
    const validRows = data.validRows as unknown[];
    return {
      inputSample: this.limitSampleSize(inputRows),
      outputSample: this.limitSampleSize(validRows),
    };
  }

  private deriveCleanSamples(data: Record<string, unknown>): {
    inputSample: unknown;
    outputSample: unknown;
  } {
    const inputRows = data.validRows as unknown[];
    const cleanedRows = data.cleanedRows as unknown[];
    return {
      inputSample: this.limitSampleSize(inputRows),
      outputSample: this.limitSampleSize(cleanedRows),
    };
  }

  private deriveTransformSamples(data: Record<string, unknown>): {
    inputSample: unknown;
    outputSample: unknown;
  } {
    const inputRows = data.cleanedRows || (data.transformedRows as unknown[]);
    const outputRows = data.transformedRows || (data.mappedRows as unknown[]);
    return {
      inputSample: this.limitSampleSize(inputRows),
      outputSample: this.limitSampleSize(outputRows),
    };
  }

  private deriveLoadSamples(data: Record<string, unknown>): {
    inputSample: unknown;
    outputSample: unknown;
  } {
    const mappedData = data.mappedData as unknown[];
    return {
      inputSample: this.limitSampleSize(mappedData),
      outputSample: null, // Final destination not captured in this data
    };
  }

  private limitSampleSize(data: unknown): unknown {
    if (!Array.isArray(data)) {
      return data;
    }

    const sampleSize = 5; // Could be made configurable via PHASE_SAMPLE_SIZE
    return data.slice(0, sampleSize);
  }

  private buildSuccessResult(
    context: OrchestrationContext,
    phases: PhaseResult[],
    metrics: OrchestrationMetrics,
    startTime: Date,
  ): OrchestrationResult {
    return {
      success: true,
      jobId: context.jobId,
      correlationId: context.correlationId,
      phases,
      totalDuration: new Date().getTime() - startTime.getTime(),
      summary: metrics,
    };
  }

  private buildErrorResult(
    context: OrchestrationContext,
    error: unknown,
    startTime: Date,
  ): OrchestrationResult {
    const baseMetrics = {
      totalRecords: 0,
      successfulRecords: 0,
      failedRecords: 1,
      phasesCompleted: 0,
      phasesSkipped: 0,
    };

    return {
      success: false,
      jobId: context.jobId,
      correlationId: context.correlationId,
      phases: [],
      totalDuration: new Date().getTime() - startTime.getTime(),
      summary: baseMetrics,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  private shouldStopOrchestration(phaseResult: PhaseResult): boolean {
    return !phaseResult.success;
  }

  private getNextPhaseData(
    phaseResult: PhaseResult,
    currentData: PhaseInputData,
  ): PhaseInputData {
    return (phaseResult.data as PhaseInputData) || currentData;
  }

  private logPhaseResultSaved(jobId: string, phase: string): void {
    this.logger.debug(`Phase result saved: ${phase} for job ${jobId}`);
  }

  private handlePhaseResultError(
    error: unknown,
    jobId: string,
    phase: string,
  ): void {
    this.logger.error(
      `Failed to save phase result ${phase} for job ${jobId}:`,
      error,
    );
  }
}
