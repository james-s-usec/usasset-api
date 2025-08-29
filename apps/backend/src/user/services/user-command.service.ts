import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { UserRepository } from '../repositories/user.repository';
import { DatabaseLoggerService } from '../../common/services/database-logger.service';
import { CreateUserRequest, UpdateUserRequest } from '../dto/user.dto';

@Injectable()
export class UserCommandService {
  public constructor(
    private readonly userRepository: UserRepository,
    private readonly dbLogger: DatabaseLoggerService,
  ) {}

  public async create(data: CreateUserRequest): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }
    return this.userRepository.create(data);
  }

  public async update(id: string, data: UpdateUserRequest): Promise<User> {
    const exists = await this.userRepository.exists(id);
    if (!exists) {
      throw new NotFoundException('User not found');
    }

    if (data.email) {
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email already in use by another user');
      }
    }

    return this.userRepository.update(id, data);
  }

  public async delete(id: string, correlationId?: string): Promise<void> {
    const cid = correlationId || 'unknown';

    await this.dbLogger.logDebug(
      cid,
      `Checking if user ${id} exists before deletion`,
      { userId: id, operation: 'delete.checkExists' },
    );

    const exists = await this.userRepository.exists(id);
    if (!exists) {
      await this.dbLogger.logWarn(cid, `Delete failed: User ${id} not found`, {
        userId: id,
        operation: 'delete.notFound',
      });
      throw new NotFoundException('User not found');
    }

    await this.dbLogger.logDebug(
      cid,
      `Executing database delete for user ${id}`,
      { userId: id, operation: 'delete.execute' },
    );

    await this.userRepository.delete(id);

    await this.dbLogger.logDebug(
      cid,
      `Database delete completed for user ${id}`,
      { userId: id, operation: 'delete.completed' },
    );
  }
}
