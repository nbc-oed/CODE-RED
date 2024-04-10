import _ from 'lodash';
import { Injectable, NotFoundException } from '@nestjs/common';
import { RedisService } from './redis/redis.service';
import { Cache } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationMessages } from 'src/common/entities/notification-messages.entity';
import { Repository } from 'typeorm';
import { DisasterMessage } from 'src/common/types/disaster-message.interface';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationMessages)
    private notificationMessageRepository: Repository<NotificationMessages>,
    private redisService: RedisService,
    private cacheManager: Cache,
  ) {}

  /**
   * 특정 사용자 위치에 따른 알림 목록 조회
   *
   * 추가 변경사항
   * - saveNotification 메서드 추가 및 NotificationMessages 엔티티 수정
   * - any 타입 -> 명확한 타입 사용으로 개선.
   *
   */

  // 1-0. Redis에 String으로 저장된 사용자 위치 <> Disaster-Streams 지역명 매칭시켜서 캐싱 후 알림 목록 반환
  async getUserNotifications(userId: number): Promise<DisasterMessage[]> {
    const cacheKey = `user-notifications:${userId}`;
    let notifications =
      await this.cacheManager.get<DisasterMessage[]>(cacheKey);

    // Cache Hit! 알림 목록 반환
    if (notifications) {
      return notifications;
    }

    // Cache Miss!! -- 캐싱 후 알림 목록 반환
    notifications = await this.retrieveAndCacheNotifications(userId, cacheKey);
    return notifications;
  }

  // 1-1. Disaster-Streams에서 재난 문자 데이터 읽어서 DB 저장 및 캐싱
  private async retrieveAndCacheNotifications(
    userId: number,
    cacheKey: string,
  ): Promise<DisasterMessage[]> {
    const userArea = await this.getUserArea(userId);
    const disasterMessages = await this.getDisasterMessages(userArea);

    for (const message of disasterMessages) {
      await this.saveNotification(userId, message);
    }

    await this.cacheManager.set(cacheKey, disasterMessages, { ttl: 3600 });
    return disasterMessages;
  }

  private async getUserArea(userId: number): Promise<string> {
    const areaKey = `user:${userId}:area`;
    const area = await this.redisService.client.get(areaKey);

    if (!area) {
      throw new NotFoundException(
        '사용자 위치 정보가 없습니다. 위치 정보를 업데이트해주세요.',
      );
    }

    return area;
  }

  // 1-2. Disaster-Streams에서 재난 문자 데이터 메시지 읽어서 매핑
  private async getDisasterMessages(area: string): Promise<DisasterMessage[]> {
    const disasterStreamKey = `disasterStream:${area}`;
    const rawMessages = await this.redisService.client.xrange(
      disasterStreamKey,
      '-',
      '+',
    );
    return rawMessages.map(([id, fields]) => this.parseDisasterMessage(fields));
  }

  // 1-3. 재난 문자 데이터 파싱
  private parseDisasterMessage(fields: string[]): DisasterMessage {
    let messageData: { [key: string]: string } = {};
    for (let i = 0; i < fields.length; i += 2) {
      messageData[fields[i]] = fields[i + 1];
    }

    const parsedData = JSON.parse(messageData['message']);
    return {
      user_id: parsedData.user_id,
      region: parsedData.large_category.join(', '),
      content: parsedData.message,
      send_datetime: new Date(parsedData.send_datetime),
    };
  }

  // 1-4. 알림 목록 조회 기록 DB에 저장
  private async saveNotification(
    userId: number,
    message: DisasterMessage,
  ): Promise<void> {
    const notification = this.notificationMessageRepository.create({
      user_id: userId,
      region: message.region,
      content: message.content,
      send_datetime: new Date(message.send_datetime),
    });

    await this.notificationMessageRepository.save(notification);
  }
}
