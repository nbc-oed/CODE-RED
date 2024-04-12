import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { RedisService } from './redis/redis.service';
import { GeoLocationService } from './streams/user-location-streams/user-location.service';
import { DisasterService } from './streams/disaster-streams/disaster.service';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DisasterData } from 'src/common/entities/disaster-data.entity';
import { HttpModule } from '@nestjs/axios';
import { NotificationMessages } from 'src/common/entities/notification-messages.entity';
import { RealtimeNotificationService } from './streams/realtime-notifications.service';
import { UtilsModule } from 'src/utils/utils.module';
import { FcmService } from './messing-services/fcm.service';
import { SmsService } from './messing-services/sms.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([DisasterData, NotificationMessages]),
    HttpModule,
    UtilsModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    RedisService,
    GeoLocationService,
    DisasterService,
    RealtimeNotificationService,
    FcmService,
    SmsService,
  ],
  exports: [RedisService, GeoLocationService],
})
export class NotificationsModule {}
