import { Controller, Get, Render, Session } from '@nestjs/common';

@Controller('/main')
export class AppController {
  @Get()
  @Render('main/main')
  async main(@Session() session) {
    session.isLogin = session.isLogin === true ? true : false;
    return { title: '서버 돌아감.' };
  }
}
