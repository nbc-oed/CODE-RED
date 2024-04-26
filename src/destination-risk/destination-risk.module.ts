import { Module } from '@nestjs/common';
import { DestinationRiskService } from './destination-risk.service';
import { DestinationRiskController } from './destination-risk.controller';
import { HttpModule } from '@nestjs/axios';
import { RedisService } from 'src/notifications/redis/redis.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Destination } from 'src/common/entities/destination.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Destination]), HttpModule],
  providers: [DestinationRiskService, RedisService],
  controllers: [DestinationRiskController],
  exports: [DestinationRiskService],
})
export class DestinationRiskModule {}
