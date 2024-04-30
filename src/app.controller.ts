import { Controller, Get, Query, Render, Res } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('aws')
  aws(@Res() res: Response) {
    return res.status(200);
  }
  @Get()
  @Render('main/basicPage')
  basic() {}

  @Get('main')
  @Render('main/main')
  async main(@Query('client_id') clientId: string) {
    return await this.appService.serveMain(clientId);
  }
  @Get('search')
  @Render('main/main')
  async search(@Query('destination') destination: string) {
    console.log(destination);
    try {
      const result = await this.appService.serveSearch(destination);

      return { result };
    } catch (error) {
      return { error: error.message };
    }
  }
}
