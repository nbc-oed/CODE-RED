import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationMessages } from 'src/common/entities/notification-messages.entity';
import { Repository } from 'typeorm';
import { NotificationStatus } from 'src/common/types/notification-status.type';

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    @InjectRepository(NotificationMessages)
    private notificationMessagesRepository: Repository<NotificationMessages>,
  ) {
    this.initializeFirebase();
  }
  // Firebase 초기화
  private initializeFirebase(): void {
    try {
      const privateKey = this.configService
        .get<string>('FIREBASE_PRIVATE_KEY')
        .replace(/\\n/g, '\n');
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
          privateKey: privateKey,
          clientEmail: this.configService.get<string>('FIREBASE_CLIENT_EMAIL'),
        }),
      });
    } catch (error) {
      this.logger.error('Firebase 초기화 실패, initialization failed:', error);
    }
  }
  /** FCM 알림 전송 로직
   * 1. 회원/비회원 푸시 토큰 조회
   * 2. 알림 전송
   * 3. 전송 성공한 알림 DB 저장
   * 4. 전송 실패한 알림 DB 저장
   */

  async sendPushNotification(
    title: string,
    message: string,
    userId?: number,
    clientId?: string,
  ) {
    // 1-1. 회원(userId), 비회원(clientId)로 해당 사용자의 푸시 토큰 조회해서 payload에 전달
    const token = await this.usersService.getTokenByIdentifiers(
      userId,
      clientId,
    );

    // 1-2. 알림 전송
    const payload = {
      token,
      notification: {
        title: title,
        body: message,
      },
    };

    try {
      // 1-3. 전송 성공한 알림 DB 저장
      const response = await admin.messaging().send(payload);
      const sentMessage = this.notificationMessagesRepository.create({
        user_id: userId,
        client_id: clientId,
        title,
        message,
        status: NotificationStatus.UnRead,
      });
      await this.notificationMessagesRepository.save(sentMessage);
      return {
        success: true,
        sent_message:
          '알림 전송 성공 / 저장 완료, Notification sent successfully',
        response,
      };
    } catch (error) {
      // 1-4. 전송 실패한 알림 DB 저장
      const failedMessage = this.notificationMessagesRepository.create({
        user_id: userId,
        client_id: clientId,
        title,
        message,
        status: NotificationStatus.Failed,
      });
      await this.notificationMessagesRepository.save(failedMessage);
      this.logger.error(
        '알림 전송 실패 / 저장 완료, Push notification send error:',
        error.message,
      );

      // 1-5. 실패한 알림(payload) 재시도 retry 로직 호출
      await this.retrySendPushNotifications(payload);
    }
  }
  private async retrySendPushNotifications(payload) {}
}
