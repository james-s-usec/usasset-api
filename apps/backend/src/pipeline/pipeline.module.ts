import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { FilesModule } from '../files/files.module';
import { PipelineController } from './pipeline.controller';
import { PipelineJobController } from './controllers/pipeline-job.controller';
import { PipelineRulesController } from './controllers/pipeline-rules.controller';
import { PipelineImportController } from './controllers/pipeline-import.controller';
import { PipelineTestController } from './controllers/pipeline-test.controller';
import { PipelineService } from './pipeline.service';
import { CsvParserService } from './services/csv-parser.service';
import { PipelineJobService } from './services/pipeline-job.service';
import { PipelineValidationService } from './services/pipeline-validation.service';
import { PipelineImportService } from './services/pipeline-import.service';
import { PipelineRepository } from './repositories/pipeline.repository';
import { RuleEngineService } from './services/rule-engine.service';
import { RuleProcessorFactory } from './services/rule-processor.factory';
import { PipelineOrchestrator } from './orchestrator/pipeline-orchestrator.service';
import { PhaseProcessorFactory } from './factories/phase-processor.factory';

// Phase processors
import { ExtractPhaseProcessor } from './phases/extract/extract-phase.processor';
import { ValidatePhaseProcessor } from './phases/validate/validate-phase.processor';
import { CleanPhaseProcessor } from './phases/clean/clean-phase.processor';
import { TransformPhaseProcessor } from './phases/transform/transform-phase.processor';
import { MapPhaseProcessor } from './phases/map/map-phase.processor';
import { LoadPhaseProcessor } from './phases/load/load-phase.processor';

/**
 * Initialize orchestrator with all phase processors
 * Factory function to register processors with orchestrator
 */

@Module({
  imports: [ConfigModule, DatabaseModule, FilesModule],
  controllers: [
    PipelineController,
    PipelineJobController,
    PipelineRulesController,
    PipelineImportController,
    PipelineTestController,
  ],
  providers: [
    // Repository layer - handles all database access
    PipelineRepository,

    // Service layer - business logic only
    PipelineService,
    PipelineJobService,
    PipelineValidationService,
    PipelineImportService,

    // Pipeline orchestration
    PipelineOrchestrator,

    // Phase processors
    ExtractPhaseProcessor,
    ValidatePhaseProcessor,
    CleanPhaseProcessor,
    TransformPhaseProcessor,
    MapPhaseProcessor,
    LoadPhaseProcessor,

    // Phase processor factory for orchestrator initialization
    PhaseProcessorFactory,

    // Rule engine services
    RuleEngineService,
    RuleProcessorFactory,

    // Utility services
    CsvParserService,
  ],
  exports: [PipelineService, PipelineRepository],
})
export class PipelineModule {}
