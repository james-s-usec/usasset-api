import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  private readonly version: string;
  private readonly buildTime: string;
  private readonly gitCommit: string;

  public constructor(private readonly appService: AppService) {
    // Simple version tracking using environment variables
    this.version = process.env.APP_VERSION ?? 'dev';
    this.buildTime = process.env.BUILD_TIME ?? new Date().toISOString();
    this.gitCommit = process.env.GIT_COMMIT ?? 'local';
  }

  @Get()
  public getHello(): string {
    return this.appService.getHello();
  }

  @Get('version')
  public getVersion(): Record<string, string> {
    return {
      version: this.version,
      buildTime: this.buildTime,
      gitCommit: this.gitCommit,
      environment: process.env.NODE_ENV || 'development',
      uptime: `${Math.floor(process.uptime())} seconds`,
    };
  }
}
