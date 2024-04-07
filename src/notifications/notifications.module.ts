import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { RedisService } from './redis/redis.service';
import { GeoLocationService } from './locations/locations.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, RedisService, GeoLocationService],
  exports: [RedisService, GeoLocationService],
})
export class NotificationsModule {}
