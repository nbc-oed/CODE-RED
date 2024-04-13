import { Module } from '@nestjs/common';
import { DestinationRiskService } from './destination-risk.service';
import { DestinationRiskController } from './destination-risk.controller';
import { HttpModule } from '@nestjs/axios';
import { RedisService } from 'src/notifications/redis/redis.service';

@Module({
    imports : [HttpModule],
    providers : [DestinationRiskService, RedisService],
    controllers : [DestinationRiskController]
})
export class DestinationRiskModule {}
