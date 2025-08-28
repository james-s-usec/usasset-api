import { Module } from '@nestjs/common';
import { DatabaseLoggerService } from './services/database-logger.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [DatabaseLoggerService],
  exports: [DatabaseLoggerService],
})
export class DatabaseLoggerModule {}
