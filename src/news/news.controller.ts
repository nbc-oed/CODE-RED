import { Controller, Get, Query, Render } from '@nestjs/common';
import { NewsService } from './news.service';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @Render('news/news')
  async serveNews() {
    return { news: await this.newsService.findAllNews(1) };
  }

  @Get('api')
  async findAllNews(@Query('page') page: number) {
    const news = await this.newsService.findAllNews(page);
    return news;
  }

  @Get('accident')
  async findAccidentNews() {
    return await this.newsService.findAccidentNews();
  }
}
