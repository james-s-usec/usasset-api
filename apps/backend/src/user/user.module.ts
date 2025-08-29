import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserRepository } from './repositories/user.repository';
import { UserQueryService } from './services/user-query.service';
import { UserCommandService } from './services/user-command.service';
import { UserBulkService } from './services/user-bulk.service';
import { DatabaseLoggerModule } from '../common/database-logger.module';

@Module({
  imports: [DatabaseLoggerModule],
  controllers: [UserController],
  providers: [
    UserRepository,
    UserQueryService,
    UserCommandService,
    UserBulkService,
  ],
  exports: [UserQueryService, UserCommandService, UserBulkService],
})
export class UserModule {}
