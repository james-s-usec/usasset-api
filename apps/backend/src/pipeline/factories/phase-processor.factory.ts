import { Injectable } from '@nestjs/common';
import { PipelineOrchestrator } from '../orchestrator/pipeline-orchestrator.service';
import { ExtractPhaseProcessor } from '../phases/extract/extract-phase.processor';
import { ValidatePhaseProcessor } from '../phases/validate/validate-phase.processor';
import { CleanPhaseProcessor } from '../phases/clean/clean-phase.processor';
import { TransformPhaseProcessor } from '../phases/transform/transform-phase.processor';
import { MapPhaseProcessor } from '../phases/map/map-phase.processor';
import { LoadPhaseProcessor } from '../phases/load/load-phase.processor';

@Injectable()
export class PhaseProcessorFactory {
  // eslint-disable-next-line max-params
  public constructor(
    private readonly orchestrator: PipelineOrchestrator,
    private readonly extractProcessor: ExtractPhaseProcessor,
    private readonly validateProcessor: ValidatePhaseProcessor,
    private readonly cleanProcessor: CleanPhaseProcessor,
    private readonly transformProcessor: TransformPhaseProcessor,
    private readonly mapProcessor: MapPhaseProcessor,
    private readonly loadProcessor: LoadPhaseProcessor,
  ) {
    this.registerProcessorsWithOrchestrator();
  }

  private registerProcessorsWithOrchestrator(): void {
    this.orchestrator.registerProcessor(this.extractProcessor);
    this.orchestrator.registerProcessor(this.validateProcessor);
    this.orchestrator.registerProcessor(this.cleanProcessor);
    this.orchestrator.registerProcessor(this.transformProcessor);
    this.orchestrator.registerProcessor(this.mapProcessor);
    this.orchestrator.registerProcessor(this.loadProcessor);
  }
}
