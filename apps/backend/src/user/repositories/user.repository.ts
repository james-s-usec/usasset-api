import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  BaseRepository,
  FindManyOptions,
} from '../../database/interfaces/base-repository.interface';
import {
  CreateUserRequest,
  UpdateUserRequest,
  UserWhereInput,
} from '../dto/user.dto';

@Injectable()
export class UserRepository
  implements BaseRepository<User, CreateUserRequest, UpdateUserRequest>
{
  public constructor(private readonly prisma: PrismaService) {}

  public async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  public async findMany<TWhere = UserWhereInput>(
    options?: FindManyOptions<TWhere>,
  ): Promise<User[]> {
    return this.prisma.user.findMany({
      skip: options?.skip,
      take: options?.take,
      where: options?.where as UserWhereInput,
      orderBy: options?.orderBy,
    });
  }

  public async create(data: CreateUserRequest): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  public async update(id: string, data: UpdateUserRequest): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  public async exists(id: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    return user !== null;
  }

  public async count<TWhere = UserWhereInput>(where?: TWhere): Promise<number> {
    return this.prisma.user.count({
      where: where as UserWhereInput,
    });
  }

  public async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }
}
