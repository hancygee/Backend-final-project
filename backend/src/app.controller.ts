import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getRoot() {
    return { status: 'ok', message: 'Hotel Booking API is running' };
  }

  @Get('health')
  async checkHealth() {
    return this.appService.getHealthCheck();
  }
}