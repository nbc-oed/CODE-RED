import { Controller, Get, Query, Render } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('/')
export class AppController {
  constructor(private readonly appService: AppService) {}
  @Get()
  @Render('main/basicPage')
  basic() {}

  @Get('main')
  @Render('main/main')
  async main(@Query('client_id') clientId: string) {
    return await this.appService.serveMain(clientId);
  }
}
