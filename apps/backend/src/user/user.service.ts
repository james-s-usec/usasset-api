import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { UserRepository } from './repositories/user.repository';
import {
  CreateUserRequest,
  UpdateUserRequest,
  UserWhereInput,
} from './dto/user.dto';

@Injectable()
export class UserService {
  public constructor(private readonly userRepository: UserRepository) {}

  public async findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  public async findMany(where?: UserWhereInput): Promise<User[]> {
    return this.userRepository.findMany({ where });
  }

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

  public async delete(id: string): Promise<void> {
    const exists = await this.userRepository.exists(id);
    if (!exists) {
      throw new NotFoundException('User not found');
    }
    return this.userRepository.delete(id);
  }

  public async bulkCreate(users: CreateUserRequest[]): Promise<User[]> {
    const results: User[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < users.length; i++) {
      try {
        const user = await this.create(users[i]);
        results.push(user);
      } catch (error) {
        errors.push({
          index: i,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    if (errors.length > 0 && results.length === 0) {
      throw new ConflictException({
        message: 'All bulk create operations failed',
        errors,
      });
    }

    return results;
  }

  public async bulkUpdate(
    updates: Array<{ id: string } & UpdateUserRequest>,
  ): Promise<User[]> {
    const results: User[] = [];
    const errors: Array<{ id: string; error: string }> = [];

    for (const updateItem of updates) {
      const { id, ...data } = updateItem;
      try {
        const user = await this.update(id, data);
        results.push(user);
      } catch (error) {
        errors.push({
          id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    if (errors.length > 0 && results.length === 0) {
      throw new NotFoundException({
        message: 'All bulk update operations failed',
        errors,
      });
    }

    return results;
  }

  public async bulkDelete(ids: string[]): Promise<{ deleted: number }> {
    let deleted = 0;
    const errors: Array<{ id: string; error: string }> = [];

    for (const id of ids) {
      try {
        await this.delete(id);
        deleted++;
      } catch (error) {
        errors.push({
          id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    if (errors.length > 0 && deleted === 0) {
      throw new NotFoundException({
        message: 'All bulk delete operations failed',
        errors,
      });
    }

    return { deleted };
  }
}
