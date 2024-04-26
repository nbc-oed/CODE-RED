import _ from 'lodash';
import { Injectable, NotFoundException } from '@nestjs/common';
import { RedisService } from './redis/redis.service';
import { Cache } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationMessages } from 'src/common/entities/notification-messages.entity';
import { In, Repository } from 'typeorm';
import { DisasterMessage } from 'src/common/types/disaster-message.interface';
import { RedisKeys } from './redis/redis.keys';
import { NotificationStatus } from 'src/common/types/notification-status.type';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationMessages)
    private notificationMessagesRepository: Repository<NotificationMessages>,
    private redisService: RedisService,
    private cacheManager: Cache,
  ) {}

  //  FCM 발송된 알림 목록 조회 API
  async getAllNotifications(userId?: number, clientId?: string) {
    const messageLists = await this.notificationMessagesRepository.find({
      where: [
        {
          user_id: userId,
          status: In([NotificationStatus.UnRead, NotificationStatus.Read]),
        },
        {
          client_id: clientId,
          status: In([NotificationStatus.UnRead, NotificationStatus.Read]),
        },
      ],
      order: { created_at: 'DESC' },
      take: 30, // 30개의 항목으로 제한
    });

    return messageLists.map((msg) => ({
      ...msg,
      created_at: new Date(msg.created_at).toLocaleString(),
    }));
  }

  // Read 상태 업데이트 API
  async getNotificationByIdAndUpdateStatus(messageId: number) {
    const readMessage = await this.notificationMessagesRepository.findOneBy({
      id: messageId,
    });

    if (!readMessage) {
      throw new NotFoundException('알림을 찾을 수 없습니다.');
    }

    readMessage.status = NotificationStatus.Read;
    await this.notificationMessagesRepository.save(readMessage);
    return readMessage;
  }
}
