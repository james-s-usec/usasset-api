import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';

@Injectable()
export class HealthService {
  private startTime = Date.now();

  constructor(private configService: ConfigService) {}

  check() {
    return {
      status: this.getHealthStatus(),
      timestamp: new Date().toISOString(),
      uptime: this.getUptime(),
      environment: this.configService.nodeEnv,
      version: this.getVersion(),
    };
  }

  async checkReadiness() {
    const basicHealth = this.check();
    const databaseStatus = await this.checkDatabase();

    return {
      ...basicHealth,
      services: {
        database: databaseStatus,
      },
    };
  }

  checkLiveness() {
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
    return this.configService.get('npm_package_version') || '1.0.0';
  }

  private checkDatabase(): Promise<string> {
    try {
      const dbUrl = this.configService.databaseUrl;
      return Promise.resolve(dbUrl ? 'connected' : 'not_configured');
    } catch {
      return Promise.resolve('disconnected');
    }
  }
}
