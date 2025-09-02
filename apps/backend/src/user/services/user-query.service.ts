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

  public async findManyPaginated(
    page: number,
    limit: number,
  ): Promise<{ users: User[]; total: number }> {
    const skip = (page - 1) * limit;

    // Get users with proper database pagination
    const [users, total] = await Promise.all([
      this.userRepository.findMany({
        skip,
        take: limit,
        where: { is_deleted: false },
        orderBy: { created_at: 'desc' },
      }),
      this.userRepository.count({ is_deleted: false }),
    ]);

    return { users, total };
  }
}
