import { Injectable } from '@nestjs/common';
import { Crawling } from './crawling/news-crawling';
import { InjectRepository } from '@nestjs/typeorm';
import { News } from './entities/news.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(News) private readonly newsRepository: Repository<News>,
    private readonly dataSource: DataSource,
  ) {}

  async saveNews() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('READ COMMITTED');
    try {
      const newsCrawling = new Crawling();
      const results: any[] = await newsCrawling.crawling();

      const insertNews = results.map((result) => ({
        title: result.title,
        url: result.url,
        media: result.newsCompany,
      }));

      await this.newsRepository
        .createQueryBuilder()
        .insert()
        .values(insertNews)
        .execute();
    } catch (e) {
      await queryRunner.rollbackTransaction();
      console.error(e);
    } finally {
      await queryRunner.release();
    }
  }

  async getNews() {
    return await this.newsRepository.find({
      select: ['id', 'title', 'url', 'media', 'created_at'],
    });
  }
}
