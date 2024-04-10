import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Users } from 'src/common/entities/users.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocationDto } from './dto/user-location.dto';
import { RedisService } from 'src/notifications/redis/redis.service';
import { GeoLocationService } from '../notifications/streams/user-location-streams/user-location.service';
import { AwsService } from 'src/aws/aws.service';

@Injectable()
export class UsersService {
  // create(createUserDto: CreateUserDto) {
  //   throw new Error('Method not implemented.');
  // }

  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    @Inject(RedisService)
    private redisService: RedisService,
    @Inject(GeoLocationService)
    private geoLocationService: GeoLocationService,
    private readonly awsService: AwsService,
  ) {}

  async getUserByEmail(email: string) {
    return this.usersRepository.findOne({
      where: {
        email,
      },
    });
  }

  async getAllUsers() {
    return this.usersRepository.find();
  }

  // 유저 상세 찾기

  async findOne(id: number) {
    const users = await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'email', 'name', 'nickname', 'profile_image'],
    });

    if (!users) {
      throw new NotFoundException('유저가 존재하지 않습니다.');
    }

    return users;
  }

  // 수정

  async update(
    id: number,
    user: Users,
    updateUserDto: UpdateUserDto,
    file: Express.Multer.File,
  ) {
    const { name, nickname } = updateUserDto;
    // const users = await this.findUserById(user.id);
    const uploadedFile = file && (await this.awsService.uploadImage(file));

    if (!user) {
      throw new NotFoundException('유저가 존재하지 않습니다.');
    }

    if (id !== user.id) {
      throw new UnauthorizedException('정보가 일치하지 않습니다.');
    }
    const updateUser = await this.usersRepository.update(user.id, {
      name,
      nickname,
      profile_image: uploadedFile,
    });

    return updateUser;
  }

  async findUserById(id: number) {
    return await this.usersRepository.findOne({ where: { id } });
  }

  // 삭제

  async remove(userId: number, user: Users) {
    const users = await this.findUserById(userId);

    if (!users) {
      throw new NotFoundException('유저가 존재하지 않습니다.');
    }

    if (userId !== users.id) {
      throw new UnauthorizedException('정보가 일치하지 않습니다.');
    }

    return await this.usersRepository.delete(userId);
  }

  //사용자 위치정보 수집 API
  async updateUserLocation(locationDto: LocationDto) {
    // TODO: 지민's 코드 재사용 -> DB에 저장된 사용자 위치정보 조회 -> 위도/경도

    // Redis에 사용자 id, 위도/경도 정보 저장
    this.redisService.client.set(
      `user:${locationDto.userId}:location`,
      JSON.stringify(locationDto),
    );
    // Reverse-Geocoding으로 사용자가 위치한 지역명 추출 및 Redis Stream 생성
    const area = await this.geoLocationService.getAreaFromCoordinates(
      locationDto.userId,
      locationDto.latitude,
      locationDto.longitude,
    );
    await this.redisService.client.set(`user:${locationDto.userId}:area`, area);
    return area;
  }
}
