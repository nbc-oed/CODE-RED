import { Controller, Get, Render } from '@nestjs/common';

@Controller('/main')
export class AppController {
  @Get()
  @Render('main/main')
  async main() {
    return { title: '서버 돌아감.' };
  }
}
