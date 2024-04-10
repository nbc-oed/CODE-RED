import { Test, TestingModule } from '@nestjs/testing';
import { NewsService } from './news.service';
import { News } from './entities/news.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Crawling } from '../crawling/news-crawling.service';
import { DataSource, Repository } from 'typeorm';

const mockDataSource = {
  createQueryRunner: jest.fn().mockReturnThis(),
};

describe('NewsService', () => {
  /* 변수선언
      - newsService : NewsService 클래스의 인스턴스를 저장
      - newsRepositoryMock : Repository<News>인터페이스의 메서드 중 일부를 가짜로 구현한 모의 객체로 저장
      - mockCrawling : 크롤링 기능을 가짜로 구현한 모의 객체를 저장
  */
  let newsService: NewsService;
  let newsRepositoryMock: Partial<Record<keyof Repository<News>, jest.Mock>>;
  let mockCrawling: jest.Mock;

  // 테스트를 실행하기전 각 테스트 케이스마다 실행
  beforeEach(async () => {
    /* newsRepositoryMock
        - Partial<Record<keyof Repository<News>, jest.Mock>> 타입을 가지는 변수
        - News 엔티티에 대한 레포지토리에 대한 모의 객체를 나타냄
            - find
                • jest.fn()를 사용하여 가짜 함수로 모킹
            - createQueryBuilder
                • mockReturnThis()를 호출하여 해당 메서드가 호출되었을 때 자기 자신을 반환하도록 설정
                • 일련의 메서드를 체이닝할 때 유용
    */
    newsRepositoryMock = {
      find: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnThis(),
    };

    /* newsRepositoryMock 객체의 createQueryBuilder 메서드를 spyOn하는 부분.
        - 실제 메서드가 호출될 때 해당 호출을 감시하고 mock할 수 있다.
        - mockReturnValue를 사용하여 createQueryBuilder 메서드가 호출될 때 반환되는 값을 설정한다.
        - 반환되는값은 일반적으로 모의 객체가 사용됨.
       
       spyOn이란?
        - Jest에서 제공하는 mocking 기능 중 하나
        - 이 함수를 사용하여 객체의 메서드를 가로채고 모니터링함.
        - 주로 함수가 호출되었는지, 얼마나 많이 호출되었는지, 어떤 인자가 전달되었는지 등을 확인하기 위해 사용

       spyOn과 jest.fn()의 차이
        jest.fn()
          • 새로운 mock 함수를 생성
          • 함수의 호출 여부를 감지하고 반환 값을 조작하는 데 사용
        spyOn
          • 기존 객체의 메서드를 가로채는 데 사용
          • 기존 객체의 메서드를 변경하지 않고 호출 여부를 모니터링하고, 원래 동작은 유지
          • 존재하는 객체의 메서드를 감시하거나 호출 여부를 추적하는 데 사용
            ex) newsRepositoryMock의 createQueryBuilder가 호출되면 가로채서  insert, values, execute의 MOCK객체를 반환
    */
    jest.spyOn(newsRepositoryMock, 'createQueryBuilder').mockReturnValue({
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    } as any);
    jest.spyOn(mockDataSource, 'createQueryRunner').mockReturnValue({
      connect: jest.fn().mockReturnThis(),
      startTransaction: jest.fn().mockReturnThis(),
      rollbackTransaction: jest.fn().mockReturnThis(),
      release: jest.fn().mockReturnThis(),
    } as any);

    /* 가짜 크롤링 리턴값 설정
       - jest의 mocking 기능을 사용하여 mockCrawling이라는 가짜 함수를 만듬.
       - mockResolvedValue 
          • 해당 가짜 함수가 호출될 때 반환되는 값을 설정.
          • 반환값은 비동기적으로 해결되는 Promise 객체.
      - 반환 되는 값은 객체 형태의 3가지 요소들.
          • 비즈니스 로직은 실제 돌아가는것이기 때문에반환되는 값은 실제 리턴 되는 값이랑 같아야함.
    */
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

    /* 테스트 모듈을 생성
        - Test.createTestingModule()
            • 테스트 모듈을 생성하는 메서드
        - providers 
            • 테스트 모듈에 등록할 프로바이더를 정의
            • NestJS 애플리케이션에서 사용되는 서비스, 리포지토리 등을 나타냄
            • NewsService 클래스를 프로바이더로 등록, 등록한 클래스는 테스트하려는 서비스
        - provide: getRepositoryToken(News)
            • getRepositoryToken(News)를 사용하여 News 엔티티에 대한 리포지토리 토큰을 생성
            • 해당 토큰을 사용하여 News 엔티티에 대한 리포지토리 프로바이더를 등록(newsRepositoryMock)
            • newsRepositoryMock 객체를 사용하여 테스트 중에 리포지토리에 대한 가짜 동작을 제공
        - provide: Crawling, useValue: { crawling: mockCrawling }
            • Crawling이라는 토큰을 제공하여 의존성으로 등록
            • useValue는 해당 의존성을 대체하는 값
            • mockCrawling 객체는 jest의 jest.fn()을 통해 생성된 함수. 즉, crawling이라는 메서드 안에 mockCrawling값이 들어있는것.
        - compile()
            • 테스트 모듈을 컴파일
            •  테스트 모듈을 구성하고 모든 의존성을 해결하여 사용할 수 있도록 준비하는 단계
    */
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

    /* 테스트 모듈에서 인스턴스 가져오기 
        - module.get<NewsService>(NewsService)
            • 테스트 모듈로부터 NewsService의 인스턴스를 가져오는 것
            • 주어진 테스트 모듈에서 제공된 프로바이더(provider)를 사용하여 서비스의 인스턴스를 만들고 반환
            • 즉, 여기에 있는 NewsService안에는 newsRepository, Crawling, DataSource가 다 들어있는 상태이며 컴파일된 상태이다.
            • 의존성 주입이 전부 된것.
    */
    newsService = module.get<NewsService>(NewsService);
  });

  // 각각의 테스트 케이스가 실행된 후에 모든 Mock 함수들이 호출된 횟수 및 호출된 인자들을 초기화하는 역할
  // 각 테스트 케이스가 서로 영향을 주지 않고 독립적으로 실행될 수 있도록 함.
  afterEach(() => {
    jest.clearAllMocks();
  });

  /* 진행 순서
      1. 실제 saveNews의 find메서드의 리턴값을 설정(비동기이기 때문에 MockResolvedValue, 일반 값이라면 MockReturnValue로 하면된다.)
      2. saveNews함수 실행.
      3. mockCrawling함수가 몇번 실행됐는지 확인, 호출을 한번밖에 하지 않으니 1번호출로 비교
      4. find메서드도 몇번 호출됐는지 확인
      5. createQueryBuilder의 insert, values가 몇번 호출됐는지, 해당 값이 들어갔는지 확인.
  */
  it('should success crawling and save', async () => {
    newsRepositoryMock.find.mockResolvedValue([{ title: 'tesTitle' }]);

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
    expect(mockDataSource.createQueryRunner().release).toHaveBeenCalledTimes(1);
  });

  it('should fail crawling and save', async () => {
    // 모의로 설정된 find 메서드가 빈 배열을 반환하도록 변경하여 트랜잭션을 실패하도록 설정
    newsRepositoryMock.find.mockRejectedValue(new Error('에러'));
    await newsService.saveNews();
    // 롤백이 실행되는지 확인
    expect(
      mockDataSource.createQueryRunner().rollbackTransaction,
    ).toHaveBeenCalledTimes(1);
    expect(mockDataSource.createQueryRunner().release).toHaveBeenCalledTimes(1);
  });

  it('should success getNews', async () => {
    const returnFindValue = [
      {
        id: 1,
        title: '강남 길거리서 여성 추행도 모자라 남친도 폭행…"술 취해서"',
        url: 'https://n.news.naver.com/mnews/article/421/0007458150',
        media: '뉴스1',
        created_at: '2024-04-04T00:02:13.482Z',
      },
      {
        id: 2,
        title: "지하철서 둔기로 시민 위협한 50대 남성…'특수협박' 현행범 체포",
        url: 'https://n.news.naver.com/mnews/article/421/0007459644',
        media: '뉴스1',
        created_at: '2024-04-04T00:02:13.482Z',
      },
      {
        id: 3,
        title: "봄철 '졸음운전' 주의보... 음주운전 사고 치사율의 두 배",
        url: 'https://n.news.naver.com/mnews/article/469/0000794309',
        media: '한국일보',
        created_at: '2024-04-04T00:02:13.482Z',
      },
      {
        id: 4,
        title:
          '택시기사 폭행, 결국 분신…운수회사 대표 1년6개월 징역형에 檢 항소',
        url: 'https://n.news.naver.com/mnews/article/008/0005021599',
        media: '머니투데이',
        created_at: '2024-04-04T00:02:13.482Z',
      },
      {
        id: 5,
        title: '졸음운전 일 평균 5.9건…"나들이 많은 봄철, 교통사고 유의해야"',
        url: 'https://n.news.naver.com/mnews/article/018/0005706870',
        media: '이데일리',
        created_at: '2024-04-04T00:02:13.482Z',
      },
    ];

    newsRepositoryMock.find.mockResolvedValue(returnFindValue);

    await newsService.getNews();

    expect(newsRepositoryMock.find).toHaveBeenCalledTimes(1);
    expect(newsRepositoryMock.find).toHaveBeenCalledWith({
      select: ['id', 'title', 'url', 'media', 'created_at'],
      order: {
        created_at: 'DESC',
      },
      take: 5,
    });
  });
});
