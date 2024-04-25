import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationMessages } from 'src/common/entities/notification-messages.entity';
import { Repository } from 'typeorm';
import { NotificationStatus } from 'src/common/types/notification-status.type';
import { url } from 'inspector';

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);
  private readonly MAX_RETRY_COUNT = 3;
  private readonly RETRY_DELAYS = [1000, 2000, 4000];

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

  async sendPushNotification(
    title: string,
    message: string,
    userId?: number,
    clientId?: string,
    url?: string,
  ) {
    const token = await this.usersService.getTokenByIdentifiers(
      userId,
      clientId,
    );

    const payload = {
      token: token,
      notification: {
        title: title,
        body: message,
      },
      data: {
        url: url,
      },
    };

    try {
      // 전송 성공한 알림 DB 저장
      const response = await admin.messaging().send(payload);
      await this.saveSendingResult(
        title,
        message,
        NotificationStatus.UnRead,
        userId,
        clientId,
      );
      this.logger.log(
        `알림 전송 성공, Notification sent successfully: ${response}`,
      );
    } catch (error) {
      await this.saveSendingResult(
        title,
        message,
        NotificationStatus.Failed,
        userId,
        clientId,
      );
      this.logger.error(
        `알림 전송 실패, Failed to send notification: ${error.message}`,
      );

      if (this.isRetryError(error.code)) {
        this.retrySendPushNotifications(payload, 0, userId, clientId);
      }
    }
  }

  // 전송 성공/실패한 알림 DB 저장
  private async saveSendingResult(
    title: string,
    message: string,
    status: NotificationStatus,
    userId?: number,
    clientId?: string,
  ) {
    const sendingResult = this.notificationMessagesRepository.create({
      user_id: userId,
      client_id: clientId,
      title,
      message,
      status,
    });
    await this.notificationMessagesRepository.save(sendingResult);
  }

  private isRetryError(code: string): boolean {
    return (
      code === 'messaging/internal-error' ||
      code === 'messaging/server-unavailable'
    );
  }

  private async retrySendPushNotifications(
    payload: any,
    attempt: number,
    userId?: number,
    clientId?: string,
  ) {
    if (attempt < this.MAX_RETRY_COUNT) {
      setTimeout(async () => {
        try {
          const response = await admin.messaging().send(payload);
          await this.saveSendingResult(
            payload.notification.title,
            payload.notification.body,
            NotificationStatus.UnRead,
            userId,
            clientId,
          );

          this.logger.log(
            `재시도 성공, 시도 횟수 ${attempt + 1} success: ${response}`,
          );
        } catch (error) {
          this.logger.error(
            `재시도 실패, 시도 횟수 ${attempt + 1} failed: ${error.message}`,
          );
          if (attempt + 1 < this.MAX_RETRY_COUNT) {
            this.retrySendPushNotifications(
              payload,
              attempt + 1,
              userId,
              clientId,
            );
          } else {
            this.logger.error('재시도 3회 달성, 재시도 중단.');
          }
        }
      }, this.RETRY_DELAYS[attempt]);
    }
  }
}
