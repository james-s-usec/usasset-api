import { Module } from '@nestjs/common';
import { LogsController } from './logs.controller';
import { DatabaseLoggerModule } from '../common/database-logger.module';

@Module({
  imports: [DatabaseLoggerModule],
  controllers: [LogsController],
})
export class LogsModule {}
