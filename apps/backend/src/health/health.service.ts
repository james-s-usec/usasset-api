import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthRepository } from './health.repository';
import { MILLISECONDS_PER_SECOND } from '../common/constants';

@Injectable()
export class HealthService {
  private startTime = Date.now();

  public constructor(
    private configService: ConfigService,
    private healthRepository: HealthRepository,
  ) {}

  public check(): Record<string, unknown> {
    return {
      status: this.getHealthStatus(),
      timestamp: new Date().toISOString(),
      uptime: this.getUptime(),
      environment: this.configService.get<string>('NODE_ENV', 'development'),
      version: this.getVersion(),
    };
  }

  public async checkReadiness(): Promise<Record<string, unknown>> {
    const basicHealth = this.check();
    const databaseStatus = await this.checkDatabase();

    return {
      ...basicHealth,
      services: {
        database: databaseStatus,
      },
    };
  }

  public checkLiveness(): Record<string, unknown> {
    return {
      status: this.getAliveStatus(),
      timestamp: new Date().toISOString(),
    };
  }

  private getHealthStatus(): string {
    return 'ok';
  }

  private getAliveStatus(): string {
    return 'alive';
  }

  private getUptime(): number {
    return Math.floor((Date.now() - this.startTime) / MILLISECONDS_PER_SECOND);
  }

  private getVersion(): string {
    return this.configService.get<string>('npm_package_version') || '1.0.0';
  }

  private async checkDatabase(): Promise<string> {
    try {
      const isConnected = await this.healthRepository.checkDatabase();
      return isConnected ? 'connected' : 'disconnected';
    } catch {
      return 'error';
    }
  }
}
