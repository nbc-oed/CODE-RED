import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { title } from 'process';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
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
      this.logger.error('Firebase initialization failed:', error);
    }
  }
  /**
   * 의문:
   *  userId와 clientId를 전달받아서 여기서 검증?
   *  서비스 단에서 token을 검증하고 token, title, message만 매개변수로 전달?
   */
  async sendPushNotification(
    title: string,
    message: string,
    userId?: number,
    clientId?: string,
  ) {
    // 회원(userId), 비회원(clientId)로 해당 사용자의 푸시 토큰 조회해서 payload에 전달
    const token = await this.usersService.getTokenByIdentifiers(
      userId,
      clientId,
    );
    const payload = {
      token,
      notification: {
        title: title,
        body: message,
      },
      data: {
        body: message,
      },
    };

    try {
      console.log('-----------payload', payload);
      const response = await admin.messaging().send(payload);
      console.log('-----------response', response);
      return { sent_message: '알림 전송 성공' };
    } catch (error) {
      this.logger.error('푸시 전송 에러', error.message);
      return { error: error.code, message: error.message };
    }
  }
}
