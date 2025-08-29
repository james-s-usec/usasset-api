import { Test, TestingModule } from '@nestjs/testing';
import { UserQueryService } from './user-query.service';
import { UserRepository } from '../repositories/user.repository';

const createMockUserRepository = (): {
  findById: jest.Mock;
  findMany: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  exists: jest.Mock;
  findByEmail: jest.Mock;
} => ({
  findById: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  exists: jest.fn(),
  findByEmail: jest.fn(),
});

describe('UserQueryService', () => {
  let service: UserQueryService;
  let mockUserRepository: ReturnType<typeof createMockUserRepository>;

  beforeEach(async () => {
    mockUserRepository = createMockUserRepository();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserQueryService,
        { provide: UserRepository, useValue: mockUserRepository },
      ],
    }).compile();
    service = module.get<UserQueryService>(UserQueryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call userRepository.findById', async () => {
    const id = 'test-id';
    await service.findById(id);
    expect(mockUserRepository.findById).toHaveBeenCalledWith(id);
  });

  it('should call userRepository.findMany', async () => {
    await service.findMany();
    expect(mockUserRepository.findMany).toHaveBeenCalledWith({
      where: undefined,
    });
  });
});
