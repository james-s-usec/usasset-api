import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  public constructor(private readonly appService: AppService) {}

  @Get()
  public getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  public getHealth(): Record<string, unknown> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'usasset-backend',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
    };
  }

  @Get('api/health/db')
  public getDbHealth(): Record<string, unknown> {
    // Add actual database check here if using Prisma
    return {
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  }
}
