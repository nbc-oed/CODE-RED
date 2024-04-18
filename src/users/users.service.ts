import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { Users } from 'src/common/entities/users.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from 'src/notifications/redis/redis.service';
import { GeoLocationService } from '../notifications/streams/user-location-streams/user-location.service';
import { AwsService } from 'src/aws/aws.service';
import { Clients } from 'src/common/entities/clients.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClientsDto } from './dto/clients.dto';

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

  /** ----------------------- 사용자 푸시 토큰 및 위치 정보------------------------------ */

  async updateClientsInfo(clientsDto: ClientsDto) {
    const { user_id, client_id, push_token, latitude, longitude } = clientsDto;
    let clientsInfo = await this.clientsRepository.findOne({
      where: [
        { push_token: push_token },
        { client_id: client_id },
        { user_id: user_id },
      ],
    });

    let area;
    console.log(clientsInfo);
    if (clientsInfo) {
      // 필드별로 변경 확인
      const isUpdated =
        clientsInfo.push_token !== push_token ||
        clientsInfo.latitude !== latitude ||
        clientsInfo.longitude !== longitude;
      if (isUpdated) {
        // 변경 사항이 있을 때만 저장
        console.log('변경 전', clientsInfo, clientsDto);
        Object.assign(clientsInfo, clientsDto);
        console.log('변경 후---------', clientsInfo, clientsDto);
        await this.clientsRepository.save(clientsInfo);
      }
    } else {
      clientsInfo = this.clientsRepository.create(clientsDto);
      await this.clientsRepository.save(clientsInfo);
    }

    // 역지오코딩 및 Redis 저장 (위도, 경도가 있는 경우)
    if (latitude !== undefined && longitude !== undefined) {
      area = await this.geoLocationService.getAreaFromCoordinates(
        latitude,
        longitude,
        user_id,
        client_id,
      );
      await this.redisService.client.set(`user:${user_id}:area`, area);
    }

    return { clientsInfo, area };
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

  // 새벽 2시마다 만료된 토큰 삭제
  @Cron(CronExpression.EVERY_DAY_AT_2AM, {
    timeZone: 'Asia/Seoul',
  })
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
