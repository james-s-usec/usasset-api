import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { FilesModule } from '../files/files.module';
import { PipelineController } from './pipeline.controller';
import { PipelineService } from './pipeline.service';
import { CsvParserService } from './services/csv-parser.service';

@Module({
  imports: [ConfigModule, DatabaseModule, FilesModule],
  controllers: [PipelineController],
  providers: [PipelineService, CsvParserService],
  exports: [PipelineService],
})
export class PipelineModule {}
