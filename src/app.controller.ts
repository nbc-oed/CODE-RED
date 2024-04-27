import { Controller, Get, Render, Req, Res, Session } from '@nestjs/common';
import { NewsService } from './news/news.service';

@Controller('/main')
export class AppController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @Render('main/main')
  async main() {
    const news = await this.newsService.findAccidentNews();
    return { news: news };
    // async main(@Session() session) {
    // session.isLogin = session.isLogin === true ? true : false;
    // return { title: '서버 돌아감.' };
  }
  @Get('test')
  @Render('test/test')
  async test() {}
}
