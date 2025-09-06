import { Module } from '@nestjs/common';
import { DatabaseLoggerService } from './services/database-logger.service';
import { BusinessLoggerService } from './services/business-logger.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [DatabaseLoggerService, BusinessLoggerService],
  exports: [DatabaseLoggerService, BusinessLoggerService],
})
export class DatabaseLoggerModule {}
