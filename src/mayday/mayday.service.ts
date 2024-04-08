import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { Repository } from 'typeorm';
import { CreateLocationDto } from './dto/create-location.dto';

@Injectable()
export class MaydayService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
  ) {}

  // 내위치 정보 저장
  async saveMyLocation(createLocationDto: CreateLocationDto, userId: number) {
    const { latitude, longitude } = createLocationDto;

    const user = await this.locationRepository
      .createQueryBuilder()
      .select()
      .where('user_id = :userId', { userId: userId })
      .getOne();

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
}
