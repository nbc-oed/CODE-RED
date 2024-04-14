import { Controller, Get, UseGuards, Logger, Post, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '@nestjs/passport';
import { UserInfo } from 'src/common/decorator/user.decorator';
import { Users } from 'src/common/entities/users.entity';
import { FcmService } from './messing-services/firebase/fcm.service';

@UseGuards(AuthGuard('jwt'))
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
  async sendTestNotification(@Body() body: { token: string; message: string }) {
    console.log(
      `알림 전송 성공, token: ${body.token}, message:${body.message} `,
    );
    return this.fcmService.sendPushNotification(body.token, body.message);
  }
}
