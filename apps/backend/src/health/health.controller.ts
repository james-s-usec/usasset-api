import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  public constructor(private readonly healthService: HealthService) {}

  @Get()
  public check(): Record<string, unknown> {
    return this.healthService.check();
  }

  @Get('ready')
  public ready(): Promise<Record<string, unknown>> {
    return this.healthService.checkReadiness();
  }

  @Get('live')
  public live(): Record<string, unknown> {
    return this.healthService.checkLiveness();
  }
}
