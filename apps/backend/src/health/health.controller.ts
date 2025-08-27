import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  check() {
    return this.healthService.check();
  }

  @Get('ready')
  ready() {
    return this.healthService.checkReadiness();
  }

  @Get('live')
  live() {
    return this.healthService.checkLiveness();
  }
}
