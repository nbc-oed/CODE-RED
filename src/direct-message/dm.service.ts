import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import _ from 'lodash';
import { DirectMessages } from 'src/common/entities/direct-messages.entity';
import { Users } from 'src/common/entities/users.entity';
import { UtilsService } from 'src/utils/utils.service';
import { Repository } from 'typeorm';
import { DmRedisService } from './dm-redis.service';

@Injectable()
export class DmService {
  constructor(
    private readonly redisService: DmRedisService,
    @InjectRepository(DirectMessages)
    private readonly dmRepo: Repository<DirectMessages>,
    @InjectRepository(Users) private readonly usersRepo: Repository<Users>,
    private readonly utilsService: UtilsService,
  ) {}

  async getDmList(userId: number): Promise<DmListDto[]> {
    const roomKeys = await this.getDmRooms(userId);

    const dmList = [];

    for (let i = 0; i < roomKeys.length; i++) {
      const length = await this.redisService.client.llen(roomKeys[i]);

      const dm = JSON.parse(
        await this.redisService.client.lindex(roomKeys[i], length - 1),
      );

      if (dm.message.length > 25) {
        dm.message = dm.message.slice(0, 22) + '...';
      }
      dm.pastTime = this.utilsService.getPastTime(new Date(dm.created_at));
      dm['user'] = await this.getUserInfo(roomKeys[i], userId);

      dmList.push(dm);
    }

    return dmList.sort((dmA, dmB) =>
      dmA.created_at > dmB.created_at ? -1 : 1,
    );
  }

  async getDmHistory(
    roomName: string,
    userId: number,
    page: number,
  ): Promise<MsgHistoryDto[]> {
    if (roomName.split('_').indexOf(`${userId}`) === -1)
      throw new UnauthorizedException();

    const redisLength = await this.redisService.client.llen(`dm:${roomName}`);
    const endIdx = redisLength - 1 - page * 20;
    const startIdx = endIdx - 20 > 0 ? endIdx - 20 : 0;
    const isOld = page >= Math.ceil(redisLength / 20);

    if (!isOld) {
      const history = await this.redisService.client.lrange(
        `dm:${roomName}`,
        startIdx,
        endIdx,
      );

      return history.map((h) => JSON.parse(h));
    } else {
      const dbPage = page - Math.ceil(redisLength / 20);
      const oldHistory = await this.dmRepo
        .createQueryBuilder('dm')
        .select(['dm.user_id', 'dm.message', 'dm.room_name', 'dm.created_at'])
        .where('dm.room_name= :room', { room: roomName })
        .orderBy('created_at', 'DESC')
        .skip(dbPage * 20)
        .take(20)
        .getMany();

      return oldHistory;
    }
  }

  async getUserInfo(roomName: string, myUserId: number): Promise<UserInfo> {
    const targetId = roomName
      .replace('dm:', '')
      .split('_')
      .filter((id) => +id !== myUserId)[0];

    const targetInfo = await this.usersRepo.findOne({
      where: { id: +targetId },
      select: ['id', 'nickname', 'profile_image'],
    });

    const myInfo = await this.usersRepo.findOne({
      where: { id: +myUserId },
      select: ['nickname'],
    });

    if (!targetInfo) {
      return {
        id: +targetId,
        nickname: '탈퇴한 사용자',
        profile_image: '/img/no-image.png',
      };
    }

    return {
      ...targetInfo,
      profile_image: targetInfo.profile_image || '/img/no-image.png',
      myNickname: myInfo.nickname,
    };
  }

  private async getDmRooms(userId?: number) {
    const keys = [];

    let cursor = '0';
    while (true) {
      const scannedData = await this.redisService.client.scan(
        cursor,
        'MATCH',
        'dm:*',
      );

      if (!_.isEmpty(scannedData[1])) {
        keys.push(...scannedData[1]);
      }

      cursor = scannedData[0];
      if (cursor === '0') break;
    }

    return userId
      ? keys.filter((key) => {
          return key.replace('dm:', '').split('_').includes(`${userId}`);
        })
      : keys;
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM, { timeZone: 'Asia/Seoul' })
  private async migrateHistory() {
    try {
      const oldHistory = [];
      const sevenDaysAgo = new Date(
        new Date().getTime() - 7 * 24 * 60 * 60 * 1000,
      );
      const roomKeys = await this.getDmRooms();

      for (let i = 0; i < roomKeys.length; i++) {
        const length = await this.redisService.client.llen(roomKeys[i]);
        const lastMsg = await this.redisService.client.lindex(
          roomKeys[i],
          length - 1,
        );
        const lastUpdatedAt = JSON.parse(lastMsg).created_at;

        if (new Date(lastUpdatedAt) < sevenDaysAgo && length > 1) {
          const history = await this.redisService.client.lrange(
            roomKeys[i],
            0,
            -1,
          );

          oldHistory.push(...history.map((h) => JSON.parse(h)));
        }
      }

      for (let i = 0; i < Math.ceil(oldHistory.length / 1000); i++) {
        this.dmRepo.insert(oldHistory.splice(i * 1000, 1000));
      }

      for (let i = 0; i < roomKeys.length; i++) {
        const length = await this.redisService.client.llen(roomKeys[i]);
        const lastMsg = await this.redisService.client.lindex(
          roomKeys[i],
          length - 1,
        );

        await this.redisService.client.del(roomKeys[i]);
        this.redisService.client.lpush(roomKeys[i], lastMsg);
      }
    } catch (err) {
      console.log(err);
    }
  }
}

abstract class UserInfo {
  id: number;
  nickname: string;
  profile_image: string;
  myNickname?: string;
}

abstract class MsgHistoryDto {
  user_id: number;
  message: string;
  room_name: string;
  created_at: Date;
}

abstract class DmListDto extends MsgHistoryDto {
  user: UserInfo;
}
