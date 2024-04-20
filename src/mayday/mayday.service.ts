import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { DataSource, Double, Repository } from 'typeorm';
import { LocationDto } from './dto/location.dto';
import { MaydayRecords } from './entities/mayday-records.entity';
import _ from 'lodash';
import { Scores } from 'src/common/entities/scores.entity';
import { RescueCompleteDto } from './dto/rescueCompleteDto.dto';
import { SendRescueMessageDto } from './dto/sendRescueMessage.dto';
import { Users } from 'src/common/entities/users.entity';
import { Cron } from '@nestjs/schedule';
import { number } from 'joi';

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
  private setIntervalId: NodeJS.Timeout;

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

    const distance = 1000;

    const helpers = await this.findHelperDistance(
      distance,
      latitude,
      longitude,
    );

    return {
      helpers,
      distanceThreshold: distance / 1000,
    };
  }

  // 구조 요청 보내기
  async sendRequestRescue(
    userId: number,
    sendRescueMessageDto: SendRescueMessageDto,
  ) {
    const { context } = sendRescueMessageDto;
    const user = await this.userRepository
      .createQueryBuilder('users')
      .leftJoinAndSelect('users.location', 'location')
      .select('users.name')
      .addSelect('location.latitude')
      .addSelect('location.longitude')
      .where('users.id = :userId', { userId })
      .getOne();

    await this.maydayRecordsRepository.insert({ user_id: userId, context });

    /*
      1. 1km안에 있는 헬퍼들에게 알림 보내기
      2. 헬퍼들이 수락을 누르게 되면 디비에 정보가 쌓임
      3. 정보가 쌓이지 않으면 헬퍼들이 수락을 누르지 않은 것임
      4. 첫번째알림을 보낸지 3분이 지나도 수락이 쌓이지 않았는지 확인
      5. 2km로 거리를 늘려 2km안에 있는 헬퍼들에게 알림을 다시보냄
      6. 3분동안 DB를 확인하면서 DB에 helper_id가 null이 아닌지 확인
      7. 총 6분이 지났는데도 안잡힌다면 다시 3km로 거리를 늘려 알림을 다시보냄
      8. 마지막으로 9분이 지났는데도 잡히지 않는다면 알림 보내는 것을 멈춘다.
      */
    // 즉, sos api안에서 다 해결해버리기.

    // 1km안에 있는 헬퍼들에게 알림 보내기
    let currentDistance = 1000;
    await this.sendAlert(
      currentDistance,
      user.location.latitude,
      user.location.longitude,
      user.name,
      context,
    );

    const checkHelperResponsePromise = (
      userId: number,
      currentDistance: number,
      latitude: number,
      longitude: number,
      name: string,
      context: string,
    ) => {
      return new Promise((resolve) => {
        const setIntervalId = setInterval(async () => {
          currentDistance += 1000;
          const message = await this.checkHelperResponse(
            userId,
            currentDistance,
            latitude,
            longitude,
            name,
            context,
            setIntervalId,
          );
          if (message) {
            resolve(message); // Promise 완료
          }
        }, 30 * 1000);
      });
    };
    return await checkHelperResponsePromise(
      userId,
      currentDistance,
      user.location.latitude,
      user.location.longitude,
      user.name,
      context,
    );
  }

  // 푸시 알림 보내기
  async sendAlert(
    distance: number,
    latitude: number,
    longitude: number,
    name: string,
    message: string,
  ) {
    // 헬퍼 구조 요청 페이지에 가야할 것들유저닉네임, 거리, 메세지
    // localhost:3000/mayday/help-request?name=곽곽&distance=1km&message='살려주세요'
    const helpers = await this.findHelperDistance(
      distance,
      latitude,
      longitude,
    );
    console.log('helpers => ', helpers);
    // await this.fcmService.sendPushNotification(title = "구조요청", message = context, userId = helpers.user_id);
    console.log(`푸시 알림 보냄`);
  }

  // 요청 수락했는지  확인하기
  async checkHelperResponse(
    userId: number,
    distance: number,
    latitude: number,
    longitude: number,
    name: string,
    message: string,
    setIntervalId: NodeJS.Timeout,
  ) {
    // 여기서는 DB를 확인하여 헬퍼들의 응답을 확인하는 작업을 구현합니다.
    const record = await this.findGetMaydayRecord(userId);
    console.log('distance => ', distance);

    if (record.helper_id) {
      // 헬퍼아이디가 있다면 setInterval멈추기
      clearInterval(setIntervalId);
      console.log('헬퍼아이디가 있다면 setInterval멈추기 진입');
      return { message: 'Accepted' };
    } else if (distance > 3000) {
      // 거리가 3000이상이라면 총 9분이 지난것이므로 멈춘다. 1km 3분뒤 2km 3분뒤 3km 3분귀 4km
      clearInterval(setIntervalId);
      console.log('총 9분이 지나 setInterval멈추기 진입');
      return { message: 'NotAccept' };
    } else if (_.isNil(record.helper_id)) {
      // 만약 응답이 없으면 거리를 늘려 다시 알림을 보냄
      await this.sendAlert(distance, latitude, longitude, name, message);
      console.log('시간도 안지났고 헬퍼아이디도 없어서 재알림 보냄');
    }
  }

  // 알림 받은 유저 정보 저장 및 거리 계산
  async acceptRescue(helperId: number, locationDto: LocationDto) {
    const { latitude, longitude, userName } = locationDto;

    const user = await this.userRepository
      .createQueryBuilder('users')
      .leftJoinAndSelect('users.location', 'location')
      .select('users.id')
      .addSelect('location.latitude')
      .addSelect('location.longitude')
      .where('users.name = :userName', { userName })
      .getOne();

    const latestRecord = await this.findGetMaydayRecord(user.id);

    if (!_.isNil(latestRecord.helper_id)) {
      throw new BadRequestException('이미 헬퍼가 배정되었습니다.');
    }

    const distanceMeter = await this.shortestDistance(
      latitude,
      longitude,
      user.location.latitude,
      user.location.longitude,
    );

    const helper = await this.userRepository.findOne({
      where: { id: helperId },
    });

    const distance = distanceMeter.shortest_distance / 1000;

    await this.maydayRecordsRepository.update(
      { id: latestRecord.id },
      { helper_id: helperId, distance: distance },
    );

    return {
      distance: Number(distance.toFixed(1)),
      helperName: helper.name,
      message: latestRecord.context,
    };
  }

  // 유저 기록 확인
  async matchInfo(userId: number) {
    const rescueRecord = await this.findGetMaydayRecord(userId);

    const helper = await this.userRepository.findOne({
      where: { id: rescueRecord.helper_id },
    });
    const distance = +rescueRecord.distance;
    return {
      distance: Number(distance.toFixed(1)),
      helperName: helper.name,
      message: rescueRecord.context,
    };
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

  // 거리순 주변 인물.대피소 찾기
  async findHelperDistance(distance, latitude, longitude) {
    const distanceThreshold = distance;
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
        `ST_Distance(ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography, 
                          ST_SetSRID(location.location, 4326)::geography)<= :distanceThreshold`,
        {
          distanceThreshold,
        },
      )
      .orderBy('distance_meters');

    const helpersArray = await queryBuilder.getRawMany();
    console.log('helpersArray => ', helpersArray);

    const helpers = helpersArray.filter((helper) => helper.distance_meters > 0);
    return helpers;
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
