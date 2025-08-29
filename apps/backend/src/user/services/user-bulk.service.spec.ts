import { Test, TestingModule } from '@nestjs/testing';
import { UserBulkService } from './user-bulk.service';
import { UserCommandService } from './user-command.service';
import { DatabaseLoggerService } from '../../common/services/database-logger.service';

interface MockUserCommandService {
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
}

interface MockDatabaseLoggerService {
  logDebug: jest.Mock;
  logWarn: jest.Mock;
  logError: jest.Mock;
}

const createMockUserCommandService = (): MockUserCommandService => ({
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

const createMockDatabaseLoggerService = (): MockDatabaseLoggerService => ({
  logDebug: jest.fn().mockResolvedValue(undefined),
  logWarn: jest.fn().mockResolvedValue(undefined),
  logError: jest.fn().mockResolvedValue(undefined),
});

describe('UserBulkService', () => {
  let service: UserBulkService;
  let mockCommandService: MockUserCommandService;
  let mockDatabaseLoggerService: MockDatabaseLoggerService;

  beforeEach(async () => {
    mockCommandService = createMockUserCommandService();
    mockDatabaseLoggerService = createMockDatabaseLoggerService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserBulkService,
        { provide: UserCommandService, useValue: mockCommandService },
        { provide: DatabaseLoggerService, useValue: mockDatabaseLoggerService },
      ],
    }).compile();

    service = module.get<UserBulkService>(UserBulkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
