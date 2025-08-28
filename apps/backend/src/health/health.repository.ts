import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class HealthRepository {
  public constructor(private readonly prisma: PrismaService) {}

  public async checkDatabase(): Promise<boolean> {
    return this.prisma.healthCheck();
  }
}
