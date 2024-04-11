import { Controller, Get, Post, Query } from '@nestjs/common';
import { NewsService } from './news.service';
import { Cron } from '@nestjs/schedule';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  async getNews() {
    return await this.newsService.getNews();
  }

  @Post()
  async saveNews() {
    await this.newsService.saveNews();
  }

  @Cron('0 */5 9-23 * * *')
  async cronNews() {
    await this.newsService.saveNews();
  }
}
