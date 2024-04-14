import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FcmService } from './notifications/messing-services/firebase/fcm.service';

@Controller('api')
export class AppConfigController {
  constructor(
    private fcmService: FcmService,
    private configService: ConfigService,
  ) {}

  @Get('firebase-config')
  getFirebaseConfig() {
    return {
      apiKey: this.configService.get<string>('FIREBASE_API_KEY'),
      authDomain: this.configService.get<string>('FIREBASE_AUTH_DOMAIN'),
      projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
      messagingSenderId: this.configService.get<string>(
        'FIREBASE_MESSAGING_SENDER_ID',
      ),
      appId: this.configService.get<string>('FIREBASE_APP_ID'),
      vapidKey: this.configService.get<string>('VAPID_PUBLIC_KEY'),
    };
  }

  @Post('save-token')
  saveToken(@Body() body: { token: string }, @Res() res: Response) {
    console.log('Received token:', body.token);
    // Here, you would typically save the token to a database or use it in some way
    //res.status(200).json({ message: 'Token saved successfully' });
  }

  @Post('register-token')
  @HttpCode(HttpStatus.OK)
  registerToken(@Body() body: { token: string }) {
    console.log('Received token:', body.token);

    // FCM 푸시 알림을 보내는 로직을 여기에 구현할 수 있습니다.
    // 예: firebase-admin 라이브러리를 사용하여 푸시 알림을 보내기

    return { message: 'Token registered successfully' };
  }

  @Post('send-token')
  async receiveTokenAndSendNotification(@Body() body: any) {
    const { token } = body;
    const message = 'This is a test push notification from NestJS server!';
    return this.fcmService.sendPushNotification(token, message);
  }
}
