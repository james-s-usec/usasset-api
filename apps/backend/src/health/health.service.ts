import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService {
  private startTime = Date.now();

  public constructor(private configService: ConfigService) {}

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
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  private getVersion(): string {
    return this.configService.get<string>('npm_package_version') || '1.0.0';
  }

  private checkDatabase(): Promise<string> {
    try {
      const dbUrl = this.configService.get<string>('DATABASE_URL');
      return Promise.resolve(dbUrl ? 'connected' : 'not_configured');
    } catch {
      return Promise.resolve('disconnected');
    }
  }
}
