import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
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
import { Clients } from 'src/common/entities/clients.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class UsersService {
  // create(createUserDto: CreateUserDto) {
  //   throw new Error('Method not implemented.');
  // }
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    @InjectRepository(Clients)
    private clientsRepository: Repository<Clients>,
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
  async registerUserLocation(
    latitude: number,
    longitude: number,
    userId?: number,
    clientId?: string,
  ) {
    // DB에 저장
    // TODO: clientId 분기 처리해서 갱신 해줘야함.
    await this.clientsRepository.save({
      latitude,
      longitude,
      client_id: clientId,
    });

    // Redis에 사용자 id, 위도/경도 정보 저장
    this.redisService.client.set(
      `user:${userId}:location`,
      JSON.stringify(userId),
    );
    // Reverse-Geocoding으로 사용자가 위치한 지역명 추출 및 Redis Stream 생성
    const area = await this.geoLocationService.getAreaFromCoordinates(
      latitude,
      longitude,
      userId,
      clientId,
    );
    await this.redisService.client.set(`user:${userId}:area`, area);
    return area;
  }

  // 클라이언트의 푸시 토큰 검증 함수
  async getTokenByIdentifiers(
    userId?: number,
    clientId?: string,
  ): Promise<string> {
    let user;
    if (userId) {
      user = await this.clientsRepository.findOneBy({ user_id: userId });
    } else if (clientId) {
      user = await this.clientsRepository.findOneBy({ client_id: clientId });
    }

    return user ? user.push_token : null;
  }

  async saveOrUpdateToken(token: string, userId?: number, clientId?: string) {
    // 클라이언트 ID를 기반으로 기존 토큰 항목을 검색
    let tokenEntry = await this.clientsRepository.findOne({
      where: [
        {
          push_token: token,
        },
        {
          user_id: userId,
        },
      ],
    });

    if (tokenEntry) {
      // 변경사항이 있는지 확인
      let changes = false;
      if (tokenEntry.push_token !== token) {
        tokenEntry.push_token = token;
        changes = true;
      }
      if (tokenEntry.client_id !== clientId) {
        tokenEntry.client_id = clientId;
        changes = true;
      }
      // 변경사항이 있으면 저장
      if (changes) {
        const data = await this.clientsRepository.save(tokenEntry);
        return {
          data,
          message: 'Token updated successfully',
        };
      } else {
        // 변경사항이 없으면 기존 데이터 반환
        return {
          data: tokenEntry,
          message: 'No changes detected',
        };
      }
    } else {
      // 토큰 항목이 없으면 새로 생성
      const newTokenEntry = this.clientsRepository.create({
        push_token: token,
        user_id: userId,
        client_id: clientId,
      });
      const data = await this.clientsRepository.save(newTokenEntry);
      return {
        data,
        message: 'Token saved successfully',
      };
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM, {
    timeZone: 'Asia/Seoul',
  }) // 새벽 2시마다 만료된 토큰 삭제
  async cleanUpOldClientsData() {
    this.logger.log('Running cleanup job for clients');
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    await this.clientsRepository
      .createQueryBuilder()
      .delete()
      .from(Clients)
      .where('updated_at < :oneWeekAgo', { oneWeekAgo })
      .execute();

    this.logger.log('Cleanup job completed');
  }
}
