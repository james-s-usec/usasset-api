import { Injectable } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

@Injectable()
export class HealthRepository {
  private prisma = new PrismaClient();

  public async checkDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1 as test`;
      return true;
    } catch {
      return false;
    }
  }

  public async onModuleDestroy(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
