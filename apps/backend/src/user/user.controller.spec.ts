import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserQueryService } from './services/user-query.service';
import { UserCommandService } from './services/user-command.service';
import { UserBulkService } from './services/user-bulk.service';
import { DatabaseLoggerService } from '../common/services/database-logger.service';

const createMockQueryService = (): {
  findMany: jest.Mock;
  findById: jest.Mock;
} => ({
  findMany: jest.fn(),
  findById: jest.fn(),
});

const createMockCommandService = (): {
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
} => ({
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

const createMockBulkService = (): {
  bulkCreate: jest.Mock;
  bulkUpdate: jest.Mock;
  bulkDelete: jest.Mock;
} => ({
  bulkCreate: jest.fn(),
  bulkUpdate: jest.fn(),
  bulkDelete: jest.fn(),
});

const createMockLoggerService = (): {
  log: jest.Mock;
  findLogsByCorrelationId: jest.Mock;
} => ({
  log: jest.fn().mockResolvedValue(undefined),
  findLogsByCorrelationId: jest.fn(),
});

describe('UserController', () => {
  let controller: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserQueryService, useValue: createMockQueryService() },
        { provide: UserCommandService, useValue: createMockCommandService() },
        { provide: UserBulkService, useValue: createMockBulkService() },
        { provide: DatabaseLoggerService, useValue: createMockLoggerService() },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
