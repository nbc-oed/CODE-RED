import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { DataSource, Repository } from 'typeorm';
import { LocationDto } from './dto/location.dto';
import { MaydayRecords } from './entities/mayday-records.entity';
import _ from 'lodash';
import { Scores } from 'src/common/entities/scores.entity';
import { RescueCompleteDto } from './dto/rescueCompleteDto.dto';
import { SendRescueMessageDto } from './dto/sendRescueMessage.dto';
import { Users } from 'src/common/entities/users.entity';

@Injectable()
export class MaydayService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    @InjectRepository(MaydayRecords)
    private readonly maydayRecordsRepository: Repository<MaydayRecords>,
    @InjectRepository(Scores)
    private readonly scoreRepository: Repository<Scores>,
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
    private readonly dataSource: DataSource,
  ) {}

  // 내위치 정보 저장
  async saveMyLocation(location: LocationDto, userId: number) {
    const { latitude, longitude } = location;

    const user = await this.findUserId(userId);

    /* ST_GeomFromText
        - PostGIS에서 사용되는 함수
        - 텍스트(WKT)형식 또는 GeoJSON 형식의 GeoJSON 형식을 취한다.
        - 선택적으로 공간 참조 시스템 식별자를 입력매개변수로 사용하여 해당 지오메트리 리턴
        - 다양한 지오메트리 유형을 처리할 수 있으며 선(line), 폴리곤(polygon) 및 다른 지오메트리 유형을 생성할 수 있다.
        - 즉, 텍스트 형식의 공간 데이터를 PostGIS의 지오 메트리나 지좌표체계에 맞는 공간객체로 변환해줌.
        - ST_GeomFromText('POINT(${longitude} ${latitude})')는 WKT를 사용하여 POINT(경도, 위도)형태의 지오메트리를 생성한것.
        - 이렇게 하면 이 경도 위도에 해당하는 포인트 지오메트리가 반환됌

      지오메트리란?
        - 기하학적인 형태를 나타내는 데이터
        - 풀어서 설명하면 현실세계의 건물, 철도, 하천, 도로, 지역 같은 것을 표현하는 데이터!
        - POINT(점) : 특정 지점을 하나의 점으로 표현한것 -> 위도 경도를 적으면 하나의 위치가 나오는것과 같음
        - LINE(선) : 두개의 점들을 연결하여 직선, 곡선을 표현하여 하천과 같은 요소를 나타냄
        - POLYGON : 세개 이상의 점으로 둘러싸인 폐곡선 영역을 나타냄. 지역과 같은 공간적인 부분을 나타냄
    */
    if (user) {
      await this.locationRepository
        .createQueryBuilder()
        .update()
        .set({
          latitude: latitude,
          longitude: longitude,
          location: () => `ST_GeomFromText('POINT(${longitude} ${latitude})')`,
        })
        .where('user_id = :userId', { userId: userId })
        .execute();
    } else {
      await this.locationRepository
        .createQueryBuilder()
        .insert()
        .into('location')
        .values({
          user_id: userId,
          latitude: latitude,
          longitude: longitude,
          location: () => `ST_GeomFromText('POINT(${longitude} ${latitude})')`,
        })
        .execute();
    }
  }

  // 내 위치 기반 유저 찾기
  async findHelper(userId: number) {
    const user = await this.findUserId(userId);

    const { latitude, longitude } = user;

    /*  ST_Distance
          - 두 지오메트리 객체 간의 거리를 계산하는 데 사용
          - 입력 매개변수로 두 개의 형상과 선택적으로 단위를 사용하고 첫 번째 형상의 한 점과 두 번째 형상의 한 점 간 최단 거리 리턴
          - 즉, ST_Distance(geometry1, geometry2)를 입력하면 최단 직선거리가 반환.
              => 
                SELECT ST_Distance(
                    ST_GeomFromText('POINT(0 0)'), 
                    ST_GeomFromText('POINT(1 1)')
                );
          - 이 직선 거리는 하버사인 공식을 사용하여 나온 직선거리!!

        ST_SetSRID
          - 지오메트리 객체의 공간 참조 ID(SRID)를 설정하는 데 사용
          - SRID는 지구의 크기와 모양을 정의하며, 공간 데이터를 해석하는 데 중요한 역할을 함.
          - ST_SetSRID(geometry, srid); 형식으로 사용됨
          - geometry는 SRID를 설정할 지오메트리 객체, SRID는 설정하려는 공간 참조
              => SELECT ST_SetSRID(ST_MakePoint(-122.34900, 47.65100), 4326);
                 위와 같다면 POINT(경도, 위도) 형태의 지오메트리를 생성하고 SRID를 설정
                 즉, SRID가 4326으로 설정된 POINT 지오메트리가 생성
                 4326 : 일반적으로 위도 경도를 나타내는 WGS 84좌표체계의 SRID
        
        ST_MakePoint
          - 좌표를 사용하여 POINT 지오메트리 객체를 생성하는 데 사용
          ST_MakePoint와 POINT의 차이점
            ST_MakePoint
              • PostGIS에서 사용되는 공간 함수이며 좌표를 직접 입력하여 지오메트리를 만들 수 있다.
            POINT
              • POINT 생성자는 SQL에서 사용되는 문법, 직접 POINT 지오메트리를 생성할 수 있다

            즉, WKT(Well-Known Text) 형식의 지오메트리를 사용하려면 POINT를 사용하고, 
                좌표 값을 직접 계산하거나 위치를 반환 받고자 할 때는 ST_MakePoint를 사용

    */
    /* 코드로직
       distanceThreshold = 거리 임계값, 1km를 의미
       1. db의 내 위치정보 위도 경도가 저장되어 있으므로 내 위경도를 가져옴.
       2. 내 위경도와 DB안에 있는 location을 비교하여 최단 거리를 뽑아냄.
       3. 그 중에서 나온 값이 1000(distanceThreshold)이하 인것을 distance_meters별칭으로 지정한다.
       4. 그것들을 distance_meters순으로 오름차순 정렬
       5. 내위치 기반 1000m안에있는 사람들이 배열 형태로 나온 것이므로 배열의 길이 = 나를 구해줄수 있는 사람수 리턴
   */

    const distanceThreshold = 1000;
    const queryBuilder = this.locationRepository
      .createQueryBuilder('location')
      .select([
        'location.*',
        `ST_Distance(ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
                             ST_SetSRID(location.location, 4326)::geography) AS distance_meters`,
      ])
      .setParameter('longitude', longitude)
      .setParameter('latitude', latitude)
      .where(
        `ST_Distance(ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326), 
                          ST_SetSRID(location.location, 4326)) <= :distanceThreshold`,
        {
          distanceThreshold,
        },
      )
      .orderBy('distance_meters');

    const helpersArray = await queryBuilder.getRawMany();

    const helpers = helpersArray.filter((helper) => helper.distance_meters > 0);
    return {
      helpers,
      distanceThreshold: distanceThreshold / 1000,
    };
  }

  // 구조 요청 보내기
  async sendRequestRescue(
    userId: number,
    sendRescueMessageDto: SendRescueMessageDto,
  ) {
    const { context, helpers } = sendRescueMessageDto;

    /*
      구조 요청 보내기 로직 추가해야함.
      구조 요청자(user), 구조 요청 수신할 유저들(receivers), 구조 요청 수락할 특정 유저(helper)
    */
    const helpersId = helpers.map((user_id) => {
      this.findUserId(+user_id);
    });
    const user = await this.userRepository.findOne({ where: { id: userId } });
    // 1km 사람에게 알림보내기 2명헬퍼 -> 메세지 보냄
    // await this.sendPushNotification(userId, helpersId, context)

    await this.maydayRecordsRepository.insert({ user_id: userId, context });

    /*
      프론트 쪽임.
      세션이나 헤더 같은곳에 구조자의 id가 들어가야 할것 같음.
    */
  }

  // 알림 받은 유저 정보 저장 및 거리 계산
  async acceptRescue(
    userId: number,
    helperId: number,
    locationDto: LocationDto,
  ) {
    const { latitude, longitude } = locationDto;

    const user = await this.findUserId(userId);
    const distanceMeter = await this.shortestDistance(
      latitude,
      longitude,
      user.latitude,
      user.longitude,
    );

    const distance = distanceMeter.shortest_distance / 1000;

    const latestRecord = await this.findGetMaydayRecord(userId);

    if (!_.isNil(latestRecord.helper_id)) {
      throw new BadRequestException('이미 헬퍼가 배정되었습니다.');
    }

    await this.maydayRecordsRepository.update(
      { id: latestRecord.id },
      { helper_id: helperId, distance: distance },
    );

    return Number(distance.toFixed(1));
  }

  // 구조 요청 완료(포인트 및 구조 요청완료 하기)
  async rescueComplete(userId: number, rescueCompleteDto: RescueCompleteDto) {
    const { score, reason } = rescueCompleteDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('READ COMMITTED');

    try {
      const latestRecord = await this.findGetMaydayRecord(userId);

      await this.maydayRecordsRepository.update(
        { id: latestRecord.id },
        { is_completed: true },
      );

      // point db에는 점수를 부여해야함..(1~10점 => 프론트에서 선택할수있도록 해야할듯.)
      await this.scoreRepository.insert({
        user_id: userId,
        record_id: latestRecord.id,
        reason,
        score,
      });
    } catch (err) {
      console.log('Rollback 실행..');
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  // 거리 계산
  async shortestDistance(lat1, lon1, lat2, lon2) {
    const distance = await this.locationRepository
      .createQueryBuilder()
      .select(
        `
    ST_Distance(
      ST_SetSRID(ST_MakePoint(:lon1, :lat1), 4326)::geography,
      ST_SetSRID(ST_MakePoint(:lon2, :lat2), 4326)::geography
    ) AS shortest_distance
  `,
      )
      .setParameter('lon1', lon1)
      .setParameter('lat1', lat1)
      .setParameter('lon2', lon2)
      .setParameter('lat2', lat2)
      .getRawOne();

    return distance;
  }

  // 유저 아이디로 찾기
  async findUserId(userId: number) {
    const user = await this.locationRepository.findOne({
      where: { user_id: userId },
    });

    return user;
  }

  // 유저 아이디로 최근 구조요청 찾기
  async findGetMaydayRecord(userId: number) {
    const latestRecord = await this.maydayRecordsRepository.findOne({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
    return latestRecord;
  }
}
