import { Controller, Get, UseGuards, Logger, Post, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '@nestjs/passport';
import { UserInfo } from 'src/common/decorator/user.decorator';
import { Users } from 'src/common/entities/users.entity';
import { FcmService } from './messing-services/firebase/fcm.service';

@Controller('notifications')
export class NotificationsController {
  private readonly logger = new Logger(`NotificationsController.name`);
  constructor(
    private notificationsService: NotificationsService,
    private fcmService: FcmService,
  ) {}

  /**
   * 특정 사용자 위치에 따른 알림 목록 조회
   */
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getUserNotifications(@UserInfo() user: Users) {
    const startTime = Date.now();

    const notificationsLists =
      await this.notificationsService.getUserNotifications(user.id);

    const endTime = Date.now();
    const executionTime = endTime - startTime;
    this.logger.log(`getUserNotifications execution time: ${executionTime} ms`);

    return notificationsLists;
  }

  @Post('send-push')
  /**
   * 클라이언트에서 서버로 디바이스 토큰을 전송하고, DB에 저장함.
   * 이제 알림을 보낼때 DB에서 디바이스 토큰을 조회해서 sendPushNotification에 매개변수로 전달해줘야함.
   * TODO:
   *
   */
  async sendTestNotification(@Body() body: { token: string; message: string }) {
    console.log(
      `알림 전송 성공, token: ${body.token}, message:${body.message} `,
    );
    return this.fcmService.sendPushNotification(body.token, body.message);
  }
  //@UseGuards(AuthGuard('jwt'))
  @Post('register-token')
  /** TODO: UsersController에 옮겨야한다고 생각됨.
   * @UserInfo() user: Users
   * createTokenDto - token, userId -> saveToken에 전달해서 DB에 저장한다.
   *
   * TODO: 비회원에게 랜덤 Id 부여 _ 로컬스토리지 setItem
   * 비회원ID, token을 서버에 전송 -> 저장
   */
  async registerToken(
    //@UserInfo() user: Users, // 2
    @Body() body: { token: string },
  ) {
    console.log('토큰 등록 및 저장, token:', body.token);
    const userId = 5; // 테스트용 userId를 token과 함께 저장
    return this.fcmService.saveOrUpdateToken(userId, body.token);
  }
}
