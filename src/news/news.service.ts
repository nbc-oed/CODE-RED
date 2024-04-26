import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { News } from 'src/common/entities/news.entity';
import { NewsLevel } from 'src/common/types/news-level.type';
import { MoreThanOrEqual, Repository } from 'typeorm';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(News) private readonly newsRepository: Repository<News>,
  ) {}

  async findAllNews(page: number) {
    return await this.pagenationNews(page);
  }

  async findAccidentNews() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return await this.newsRepository.find({
      where: {
        created_at: MoreThanOrEqual(today),
        news_level: NewsLevel.Danger,
      },
      order: { created_at: 'DESC' },
    });
  }

  async pagenationNews(page: number) {
    const pageSize = 15;
    if (isNaN(page)) {
      page = 0;
    } else {
      page = page - 1;
    }
    const curruntpage = pageSize * page;

    const news = await this.newsRepository
      .createQueryBuilder('news')
      .orderBy('news.created_at', 'DESC')
      .offset(curruntpage)
      .limit(pageSize)
      .getMany();

    return news.map((news) => ({
      ...news,
      created_at: new Date(news.created_at).toLocaleDateString(),
    }));
  }
}
