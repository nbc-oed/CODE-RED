import { Injectable } from '@nestjs/common';
import { Crawling } from '../crawling/news-crawling.service';
import { InjectRepository } from '@nestjs/typeorm';
import { News } from './entities/news.entity';
import { Between, DataSource, Repository } from 'typeorm';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(News) private readonly newsRepository: Repository<News>,
    private readonly dataSource: DataSource,
    private readonly crawling: Crawling,
  ) {}

  async saveNews() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('READ COMMITTED');
    try {
      const results: any[] = await this.crawling.crawling();
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
        text: result.text,
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
      order: {
        created_at: 'DESC',
      },
      take: 5,
    });
  }

  async findAccident() {
    const keywords = [
      '구속',
      '검거',
      '법원',
      '항소',
      '징역',
      '구형',
      '법원',
      '수사',
      '공판',
      '판사',
      '기소',
      '송치',
      '지난',
      '전날',
      '작년',
      '체포',
      '단속',
      '법정',
      '고속도로',
    ];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const news = await this.newsRepository.find({
      select: ['title', 'text', 'url'],
      where: {
        created_at: Between(today, new Date()),
      },
    });

    let filterNews = [];
    for (let i = 0; i < news.length; i++) {
      if (keywords.some((keyword) => news[i].title.includes(keyword))) {
        continue;
      }
      if (keywords.some((keyword) => news[i].text.includes(keyword))) {
        continue;
      }
      filterNews.push(news[i]);
    }

    return filterNews;
  }
}
