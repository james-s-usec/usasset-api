import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { FilesModule } from '../files/files.module';
import { PipelineController } from './pipeline.controller';
import { PipelineService } from './pipeline.service';
import { CsvParserService } from './services/csv-parser.service';
import { PipelineJobService } from './services/pipeline-job.service';
import { PipelineValidationService } from './services/pipeline-validation.service';
import { PipelineImportService } from './services/pipeline-import.service';
import { PipelineRepository } from './repositories/pipeline.repository';
import { RuleEngineService } from './services/rule-engine.service';
import { RuleProcessorFactory } from './services/rule-processor.factory';

@Module({
  imports: [ConfigModule, DatabaseModule, FilesModule],
  controllers: [PipelineController],
  providers: [
    // Repository layer - handles all database access
    PipelineRepository,

    // Service layer - business logic only
    PipelineService,
    PipelineJobService,
    PipelineValidationService,
    PipelineImportService,

    // Rule engine services
    RuleEngineService,
    RuleProcessorFactory,

    // Utility services
    CsvParserService,
  ],
  exports: [PipelineService, PipelineRepository],
})
export class PipelineModule {}
