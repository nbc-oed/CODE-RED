import _ from 'lodash';
import { Injectable, NotFoundException } from '@nestjs/common';
import { RedisService } from './redis/redis.service';
import { Cache } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationMessages } from 'src/common/entities/notification-messages.entity';
import { Repository } from 'typeorm';

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
   * Redis에 String으로 저장된 사용자 위치 <> Disaster-Streams 지역명 매칭시켜서 캐싱 후 알림 목록 반환
   */

  // 1-0. Redis에 String으로 저장된 사용자 위치 <> Disaster-Streams 지역명 매칭시켜서 캐싱 후 알림 목록 반환
  async getUserNotifications(userId: number) {
    const cacheKey = `user-notifications:${userId}`;
    let notifications = await this.cacheManager.get(cacheKey);
    // 캐시에 데이터가 있으면 바로 반환
    if (notifications) {
      console.log('Cache Hit!! -- 캐시에서 알림 목록 반환');
      return notifications;
    }

    // 캐시에 데이터가 없는 경우, Redis에서 알림 목록을 조회
    console.log('Cache Miss!! -- 캐싱 후 알림 목록 반환');
    notifications = await this.retrieveAndCacheNotifications(userId, cacheKey);
    return notifications;
  }

  // 1-1. Disaster-Streams에서 재난 문자 데이터 읽어서 캐싱
  private async retrieveAndCacheNotifications(
    userId: number,
    cacheKey: string,
  ): Promise<any[]> {
    // Redis에 String으로 저장된 사용자의 지역명 조회
    const areaKey = `user:${userId}:area`;
    const area = await this.redisService.client.get(areaKey);
    console.log('Redis에 저장된 사용자 위치 정보:', area);

    if (!area) {
      throw new NotFoundException(
        '사용자 위치 정보가 없습니다. 위치 정보를 업데이트해주세요.',
      );
    }

    // 해당 지역의 재난 문자 데이터 읽기
    const disasterStreamKey = `disasterStream:${area}`;
    const disasterMessages = await this.getDisasterMessages(disasterStreamKey);
    console.log(`사용자 해당 지역 '${area}'의 재난 문자:`, disasterMessages);

    // 조회된 알림을 캐시에 저장
    await this.cacheManager.set(cacheKey, disasterMessages, { ttl: 3600 }); // 1시간 동안 캐시 유지

    // getDisasterMessages 결과를 반환
    return disasterMessages;
  }

  // 1-2. Disaster-Streams에서 재난 문자 데이터 메시지 읽어서 매핑
  async getDisasterMessages(streamKey: string): Promise<any[]> {
    try {
      const messages = await this.redisService.client.xrange(
        streamKey,
        '-',
        '+',
      );
      return messages.map(([id, fields]) => {
        const data = this.parseFields(fields);
        return { id, data };
      });
    } catch (error) {
      console.error('재난 문자 데이터 스트림 읽기/파싱 실패:', error);
      throw error;
    }
  }

  // 1-3. 재난 문자 데이터 파싱
  private parseFields(fields: string[]): any {
    // 배열을 객체로 변환
    let data = {};
    for (let i = 0; i < fields.length; i += 2) {
      data[fields[i]] = fields[i + 1];
    }
    return data;
  }
}
