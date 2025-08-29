import { Test, TestingModule } from '@nestjs/testing';
import { UserCommandService } from './user-command.service';
import { UserRepository } from '../repositories/user.repository';
import { DatabaseLoggerService } from '../../common/services/database-logger.service';

interface MockUserRepository {
  findById: jest.Mock;
  findMany: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  exists: jest.Mock;
  findByEmail: jest.Mock;
}

interface MockDatabaseLoggerService {
  logDebug: jest.Mock;
  logWarn: jest.Mock;
  logError: jest.Mock;
}

const createMockUserRepository = (): MockUserRepository => ({
  findById: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  exists: jest.fn(),
  findByEmail: jest.fn(),
});

const createMockDatabaseLoggerService = (): MockDatabaseLoggerService => ({
  logDebug: jest.fn().mockResolvedValue(undefined),
  logWarn: jest.fn().mockResolvedValue(undefined),
  logError: jest.fn().mockResolvedValue(undefined),
});

describe('UserCommandService', () => {
  let service: UserCommandService;
  let mockUserRepository: MockUserRepository;
  let mockDatabaseLoggerService: MockDatabaseLoggerService;

  beforeEach(async () => {
    mockUserRepository = createMockUserRepository();
    mockDatabaseLoggerService = createMockDatabaseLoggerService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserCommandService,
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: DatabaseLoggerService, useValue: mockDatabaseLoggerService },
      ],
    }).compile();

    service = module.get<UserCommandService>(UserCommandService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
