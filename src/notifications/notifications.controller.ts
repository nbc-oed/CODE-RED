import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '@nestjs/passport';
import { UserInfo } from 'src/common/decorator/user.decorator';
import { Users } from 'src/common/entities/users.entity';

@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  // 특정 사용자 위치에 따른 알림 목록 조회
  @Get()
  async getUserNotifications(@UserInfo() user: Users) {
    console.log('Notification Controller --- userId:', user.id);
    return this.notificationsService.getUserNotifications(user.id);
  }
}
