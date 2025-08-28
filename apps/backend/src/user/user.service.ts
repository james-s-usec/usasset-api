import { Injectable } from '@nestjs/common';
import { User } from '../../generated/prisma';
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
      throw new Error('User with this email already exists');
    }
    return this.userRepository.create(data);
  }

  public async update(id: string, data: UpdateUserRequest): Promise<User> {
    const exists = await this.userRepository.exists(id);
    if (!exists) {
      throw new Error('User not found');
    }

    if (data.email) {
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser && existingUser.id !== id) {
        throw new Error('Email already in use by another user');
      }
    }

    return this.userRepository.update(id, data);
  }

  public async delete(id: string): Promise<void> {
    const exists = await this.userRepository.exists(id);
    if (!exists) {
      throw new Error('User not found');
    }
    return this.userRepository.delete(id);
  }
}
