import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { UserRepository } from '../repositories/user.repository';
import { UserWhereInput } from '../dto/user.dto';

@Injectable()
export class UserQueryService {
  public constructor(private readonly userRepository: UserRepository) {}

  public async findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  public async findMany(where?: UserWhereInput): Promise<User[]> {
    return this.userRepository.findMany({ where });
  }
}
