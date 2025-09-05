import { Injectable, Logger } from '@nestjs/common';
import { PipelinePhase } from '@prisma/client';
import {
  PhaseProcessor,
  PhaseContext,
  PhaseResult,
} from './phase-processor.interface';
import { PipelineService } from '../pipeline.service';

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

  public constructor(private readonly legacyPipelineService: PipelineService) {}

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
