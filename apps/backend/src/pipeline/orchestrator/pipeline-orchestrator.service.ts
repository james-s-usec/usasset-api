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
    const correlationId = `orchestration-${Date.now()}`;
    const jobId = `job-${Date.now()}`;
    const startTime = new Date();

    this.logger.log(
      `Starting orchestration for file ${fileId} with correlation ${correlationId}`,
    );

    const phases: PhaseResult[] = [];
    let currentData: any = { fileId };
    let totalRecords = 0;
    let successfulRecords = 0;
    let failedRecords = 0;

    // Define the pipeline phases in order
    const pipelinePhases: PipelinePhase[] = [
      PipelinePhase.EXTRACT,
      PipelinePhase.VALIDATE,
      PipelinePhase.CLEAN,
      PipelinePhase.TRANSFORM,
      PipelinePhase.MAP,
      PipelinePhase.LOAD,
    ];

    try {
      for (const phase of pipelinePhases) {
        const context: PhaseContext = {
          jobId,
          correlationId,
          fileId,
          metadata: {
            orchestrationStart: startTime,
            currentPhase: phase,
            previousPhases: phases.map((p) => p.phase),
          },
        };

        this.logger.debug(`Processing phase: ${phase}`);

        const processor = this.processors.get(phase);
        if (!processor) {
          this.logger.warn(
            `No processor registered for phase: ${phase}, skipping`,
          );
          continue;
        }

        const phaseResult = await processor.process(currentData, context);
        phases.push(phaseResult);

        // Update metrics
        totalRecords = Math.max(
          totalRecords,
          phaseResult.metrics.recordsProcessed,
        );
        successfulRecords += phaseResult.metrics.recordsSuccess;
        failedRecords += phaseResult.metrics.recordsFailed;

        // If phase failed critically, stop orchestration
        if (!phaseResult.success && phaseResult.errors.length > 0) {
          this.logger.error(
            `Phase ${phase} failed critically, stopping orchestration`,
          );
          break;
        }

        // Pass processed data to next phase
        if (phaseResult.data !== undefined) {
          currentData = phaseResult.data;
        }

        this.logger.debug(
          `Phase ${phase} completed in ${phaseResult.metrics.durationMs}ms`,
        );
      }

      const endTime = new Date();
      const totalDuration = endTime.getTime() - startTime.getTime();
      const overallSuccess =
        phases.length > 0 && phases.every((p) => p.success);

      const result: OrchestrationResult = {
        success: overallSuccess,
        jobId,
        correlationId,
        phases,
        totalDuration,
        summary: {
          totalRecords,
          successfulRecords,
          failedRecords,
          phasesCompleted: phases.filter((p) => p.success).length,
          phasesSkipped: pipelinePhases.length - phases.length,
        },
      };

      this.logger.log(
        `Orchestration completed in ${totalDuration}ms. Success: ${overallSuccess}`,
      );
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Orchestration failed: ${errorMessage}`);

      const endTime = new Date();
      return {
        success: false,
        jobId,
        correlationId,
        phases,
        totalDuration: endTime.getTime() - startTime.getTime(),
        summary: {
          totalRecords: 0,
          successfulRecords: 0,
          failedRecords: 0,
          phasesCompleted: phases.filter((p) => p.success).length,
          phasesSkipped: pipelinePhases.length - phases.length,
        },
      };
    }
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
