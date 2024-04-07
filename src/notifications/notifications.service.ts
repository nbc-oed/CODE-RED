import { Injectable } from '@nestjs/common';
import { RedisService } from './redis/redis.service';

@Injectable()
export class NotificationsService {
  constructor(private redisService: RedisService) {}

  async sendNotificationsForRegion(region: string) {
    const streamKey = `stream:${region}`;
    const groupName = 'consumerGroup';
    const consumerName = 'notifications';

    // Redis 스트림에서 새로운 메시지 읽기
    const messages = await this.redisService.client.xreadgroup(
      'GROUP',
      groupName,
      consumerName,
      'STREAMS',
      streamKey, // TODO 배열이 안들어감.
      '>',
      0,
    );

    if (messages) {
      for (const message of messages) {
        const users = await this.getUsersForRegion(region); // 지역별 사용자 조회
        for (const user of users) {
          // 실제 알림 전송 로직 (예: 이메일, SMS 등)
          this.sendNotificationToUser(user, message);
        }

        // 메시지 확인 처리
        // await this.redisService.client.xack(streamKey, groupName, message.id);
      }
    }
  }

  private async getUsersForRegion(region: string) {
    // 지역에 해당하는 사용자 목록을 조회하는 로직
    return [
      { userId: 1, email: 'user1@example.com' },
      { userId: 2, email: 'user2@example.com' },
    ];
  }

  private async sendNotificationToUser(user: any, message: any) {
    // 사용자에게 실제 알림을 전송하는 로직
    // 예: 이메일, SMS, 푸시 알림 등
    console.log(`Sending notification to ${user.email}: ${message.message}`);
  }
}
