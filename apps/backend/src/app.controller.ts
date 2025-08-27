import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'usasset-backend',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
    };
  }

  @Get('api/health/db')
  getDbHealth() {
    // Add actual database check here if using Prisma
    return {
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  }
}
