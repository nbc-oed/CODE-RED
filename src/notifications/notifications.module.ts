import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { RedisService } from './redis/redis.service';
import { GeoLocationService } from './locations/locations.service';
import { DisasterService } from './disaster/disaster.service';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DisasterData } from 'src/common/entities/disaster-data.entity';
import { HttpModule } from '@nestjs/axios';
import { NotificationMessages } from 'src/common/entities/notification-messages.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([DisasterData, NotificationMessages]),
    HttpModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    RedisService,
    GeoLocationService,
    DisasterService,
  ],
  exports: [RedisService, GeoLocationService],
})
export class NotificationsModule {}
