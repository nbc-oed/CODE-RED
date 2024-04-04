import { Test, TestingModule } from '@nestjs/testing';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';

describe('NewsController', () => {
  let newsController: NewsController;
  let newsServiceMock: Partial<Record<keyof NewsService, jest.Mock>>;

  beforeEach(async () => {
    newsServiceMock = {
      getNews: jest.fn(),
      saveNews: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NewsController],
      providers: [{ provide: NewsService, useValue: newsServiceMock }],
    }).compile();

    newsController = module.get<NewsController>(NewsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should success getNews', async () => {
    const returnGetNewsValue = [
      {
        id: 1,
        title: '강남 길거리서 여성 추행도 모자라 남친도 폭행…"술 취해서"',
        url: 'https://n.news.naver.com/mnews/article/421/0007458150',
        media: '뉴스1',
        created_at: '2024-04-04T00:02:13.482Z',
      },
    ];

    newsServiceMock.getNews.mockResolvedValue(returnGetNewsValue);

    const news = await newsController.getNews();

    expect(newsServiceMock.getNews).toHaveBeenCalledTimes(1);
    expect(news).toBeDefined();
  });

  it('should success saveNews', async () => {
    const news = await newsController.saveNews();

    expect(newsServiceMock.saveNews).toHaveBeenCalledTimes(1);
    expect(news).not.toBeDefined();
  });
});
