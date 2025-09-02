import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  DATABASE_RETRY_MAX_ATTEMPTS,
  DATABASE_RETRY_BASE_DELAY,
  DATABASE_RETRY_MULTIPLIER,
} from '../common/constants';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  public constructor() {
    super({
      log:
        process.env.NODE_ENV === 'production'
          ? ['warn', 'error']
          : ['info', 'warn', 'error'], // Removed 'query' to reduce spam
      errorFormat: 'pretty',
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  public async onModuleInit(): Promise<void> {
    let retryCount = 0;

    while (retryCount < DATABASE_RETRY_MAX_ATTEMPTS) {
      try {
        await this.$connect();
        this.logger.log('Database connected successfully');
        return;
      } catch (error) {
        retryCount++;
        this.logger.warn(
          `Database connection attempt ${retryCount}/${DATABASE_RETRY_MAX_ATTEMPTS} failed:`,
          error,
        );

        if (retryCount >= DATABASE_RETRY_MAX_ATTEMPTS) {
          this.logger.error('Max database connection retries exceeded');
          throw error;
        }

        await this.delay(
          Math.pow(DATABASE_RETRY_MULTIPLIER, retryCount) *
            DATABASE_RETRY_BASE_DELAY,
        );
      }
    }
  }

  public async onModuleDestroy(): Promise<void> {
    try {
      await this.$disconnect();
      this.logger.log('Database disconnected');
    } catch (error) {
      this.logger.error('Error disconnecting from database:', error);
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1 as test`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
