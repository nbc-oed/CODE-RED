import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientToken } from 'src/common/entities/client-token.entity';
import { Repository } from 'typeorm';

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    @InjectRepository(ClientToken)
    private clientTokenRepository: Repository<ClientToken>,
  ) {
    this.initializeFirebase();
  }

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
   * 클라이언트에서 토큰 관리 및 서버로 전송
클라이언트 애플리케이션(예: 웹 또는 모바일 앱)에서는 Firebase 클라이언트 라이브러리를 사용하여 사용자의 푸시 알림 허용 여부를 확인하고, 허용된 경우 토큰을 얻습니다. 이 토큰은 다음과 같은 과정을 통해 얻을 수 있습니다:

푸시 알림 권한 요청: 사용자에게 푸시 알림을 보낼 수 있는 권한을 요청합니다.
토큰 생성 및 갱신: 사용자가 권한을 허용하면, getToken을 호출하여 토큰을 생성하거나 갱신합니다.
토큰 서버로 전송: 생성된 토큰을 서버에 전송하여 데이터베이스 등에 저장합니다. 이렇게 저장된 토큰은 특정 사용자에게 메시지를 보낼 때 사용됩니다.
서버에서 푸시 알림 전송
서버에서는 저장된 토큰을 사용하여 Firebase Admin SDK를 통해 푸시 알림을 전송합니다. sendPushNotification 함수는 다음과 같이 동작합니다:

Payload 준비: 전송할 메시지와 함께 토큰을 포함한 페이로드를 준비합니다.
메시지 전송: admin.messaging().send(payload)를 호출하여 특정 토큰을 가진 디바이스로 메시지를 전송합니다.
결과 처리: 성공적으로 메시지를 전송했는지, 오류가 발생했는지에 따라 적절한 처리를 합니다.
   */

  async sendPushNotification(token: string, message: string) {
    const payload = {
      token, /////////////////////////////////여기 이 토큰
      notification: {
        title: '재난 경보',
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
      return { sent_message: response };
    } catch (error) {
      this.logger.error('푸시 전송 에러', error.message);
      return { error: error.code, message: error.message };
    }
  }

  async saveOrUpdateToken(userId: number, token: string) {
    let tokenEntry = await this.clientTokenRepository.findOneBy({ userId });
    if (tokenEntry) {
      tokenEntry.token = token;
      await this.clientTokenRepository.save(tokenEntry);
      return { message: 'Token updated successfully' };
    } else {
      const tokenEntry = this.clientTokenRepository.create({ userId, token });
      await this.clientTokenRepository.save(tokenEntry);
      return { message: 'Token saved successfully' };
    }
  }
}
