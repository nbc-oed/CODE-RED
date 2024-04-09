import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { Repository } from 'typeorm';
import { LocationDto } from './dto/location.dto';
import { MaydayRecords } from './entities/mayday-records.entity';

@Injectable()
export class MaydayService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    @InjectRepository(MaydayRecords)
    private readonly maydayRecordsRepository: Repository<MaydayRecords>,
  ) {}

  // 내위치 정보 저장
  async saveMyLocation(location: LocationDto, userId: number) {
    const { latitude, longitude } = location;

    const user = await this.findUserId(userId);

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

    console.log(latitude, longitude);

    try {
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

      const helpers = helpersArray.filter(
        (helper) => helper.distance_meters > 0,
      );
      return helpers.length;
    } catch (err) {
      console.error('An error occurred while finding helpers:', err);
      return 'Failed';
    }
  }

  // 구조 요청 보내기
  async sos(userId: number) {
    /*
      구조 요청 보내기 로직 추가해야함.
    */

    await this.maydayRecordsRepository.insert({ user_id: userId });

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
    console.log(userId, helperId);

    const user = await this.findUserId(userId);
    const distanceMeter = await this.shortestDistance(
      latitude,
      longitude,
      user.latitude,
      user.longitude,
    );

    const distance = distanceMeter.shortest_distance / 1000;

    const latestRecord = await this.maydayRecordsRepository.findOne({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });

    await this.maydayRecordsRepository.update(
      { id: latestRecord.id },
      { helper_id: helperId, distance: distance },
    );

    return Number(distance.toFixed(1));
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
    const user = await this.locationRepository
      .createQueryBuilder()
      .select()
      .where('user_id = :userId', { userId: userId })
      .getOne();

    return user;
  }
}
