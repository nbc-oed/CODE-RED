import { Test, TestingModule } from '@nestjs/testing';
import { NewsService } from './news.service';
import { News } from './entities/news.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Crawling } from '../crawling/news-crawling.service';
import { DataSource, Repository } from 'typeorm';

const mockDataSource = {
  createQueryRunner: jest.fn(() => ({
    connect: jest.fn(),
    startTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
  })),
};

describe('NewsService', () => {
  let newsService: NewsService;
  let newsRepositoryMock: Partial<Record<keyof Repository<News>, jest.Mock>>;
  let mockCrawling: jest.Mock;

  beforeEach(async () => {
    newsRepositoryMock = {
      find: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnThis(),
    };

    jest.spyOn(newsRepositoryMock, 'createQueryBuilder').mockReturnValue({
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    } as any);

    mockCrawling = jest.fn().mockResolvedValue([
      {
        url: 'newsUrl1',
        title: 'newsTitle1',
        newsCompany: 'newsMedia1',
      },
      {
        title: 'newsTitle2',
        url: 'newsUrl2',
        newsCompany: 'newsMedia2',
      },
    ]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsService,
        {
          provide: getRepositoryToken(News),
          useValue: newsRepositoryMock,
        },
        { provide: Crawling, useValue: { crawling: mockCrawling } },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    newsService = module.get<NewsService>(NewsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should success crawling and save', async () => {
    newsRepositoryMock.find.mockResolvedValue([{ title: 'tesTitle' }]);
    jest.spyOn(newsRepositoryMock, 'createQueryBuilder').mockReturnValue({
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    } as any);
    await newsService.saveNews();

    expect(mockCrawling).toHaveBeenCalledTimes(1);

    expect(newsRepositoryMock.find).toHaveBeenCalledTimes(1);

    const createQueryBuilderMock = newsRepositoryMock.createQueryBuilder();
    expect(createQueryBuilderMock.insert).toHaveBeenCalledTimes(1);

    expect(createQueryBuilderMock.insert().values).toHaveBeenCalledTimes(1);
    expect(createQueryBuilderMock.insert().values).toHaveBeenCalledWith([
      { title: 'newsTitle1', url: 'newsUrl1', media: 'newsMedia1' },
      { title: 'newsTitle2', url: 'newsUrl2', media: 'newsMedia2' },
    ]);
  });
});
