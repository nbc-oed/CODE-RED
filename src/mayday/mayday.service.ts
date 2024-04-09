import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { Repository } from 'typeorm';
import { LocationDto } from './dto/location.dto';

@Injectable()
export class MaydayService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
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

  async findHelper(userId: number) {
    const user = await this.findUserId(userId);

    const { latitude, longitude } = user;

    console.log(latitude, longitude);

    try {
      // const helpers = await this.locationRepository
      //   .createQueryBuilder()
      //   .select('*')
      //   .addSelect(
      //     `ST_DISTANCE(POINT(:longitude, :latitude), location) AS distance`,
      //   )
      //   .from((subQuery) => {
      //     return subQuery
      //       .select('*')
      //       .from('location', 'helper') // 서브쿼리에서 location 테이블을 "helper" 별칭으로 사용합니다.
      //       .where(
      //         `ST_DISTANCE(POINT(:longitude, :latitude), location) <= :distanceThreshold`,
      //         {
      //           longitude: longitude,
      //           latitude: latitude,
      //           distanceThreshold: 1000,
      //         },
      //       )
      //       .andWhere(
      //         `ST_DISTANCE(POINT(:longitude, :latitude), location) > 0`,
      //       );
      //   }, 'helper')
      //   .orderBy('distance')
      //   .getRawMany();

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
      console.log(helpers);

      return helpers.length;
    } catch (err) {
      console.error('An error occurred while finding helpers:', err);
      return 'Failed';
    }
  }

  async acceptRescue(userId: number, locationDto: LocationDto) {
    const { latitude, longitude } = locationDto;
    const user = await this.findUserId(userId);
    const distanceMeter = await this.shortestDistance(
      latitude,
      longitude,
      user.latitude,
      user.longitude,
    );

    const distance = distanceMeter.shortest_distance / 1000;
    return Number(distance.toFixed(1));
  }

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

  async findUserId(userId: number) {
    const user = await this.locationRepository
      .createQueryBuilder()
      .select()
      .where('user_id = :userId', { userId: userId })
      .getOne();

    return user;
  }
}
