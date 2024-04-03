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
      const newResults: any[] = [];
      const savedNews = await this.newsRepository.find({
        select: ['title'],
      });

      const savedTitles = savedNews.map((news) => news.title);

      for (let i = 0; i < results.length; i++) {
        if (!savedTitles.includes(results[i].title)) {
          newResults.push(results[i]);
        }
      }

      const insertNews = newResults.map((result) => ({
        title: result.title,
        url: result.url,
        media: result.newsCompany,
      }));

      await this.newsRepository
        .createQueryBuilder()
        .insert()
        .values(insertNews)
        .execute();
    } catch (err) {
      console.log('Rollback 실행..');
      await queryRunner.rollbackTransaction();
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
