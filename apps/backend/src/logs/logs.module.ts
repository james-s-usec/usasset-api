import { Module } from '@nestjs/common';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';
import { LogsRepository } from './repositories/logs.repository';
import { DatabaseLoggerModule } from '../common/database-logger.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseLoggerModule, DatabaseModule],
  controllers: [LogsController],
  providers: [LogsService, LogsRepository],
})
export class LogsModule {}
