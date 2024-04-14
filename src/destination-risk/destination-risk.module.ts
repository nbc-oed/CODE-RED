import { Module } from '@nestjs/common';
import { DestinationRiskService } from './destination-risk.service';
import { DestinationRiskController } from './destination-risk.controller';
import { HttpModule } from '@nestjs/axios';
import { RedisService } from 'src/notifications/redis/redis.service';
import { MaydayService } from 'src/mayday/mayday.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from '../mayday/entities/location.entity';
import { MaydayRecords } from 'src/mayday/entities/mayday-records.entity';
import { Destination } from 'src/common/entities/destination.entity';

@Module({
    imports : [
        TypeOrmModule.forFeature([Location, MaydayRecords, Destination]),HttpModule
    ],
    providers : [DestinationRiskService, RedisService, MaydayService],
    controllers : [DestinationRiskController]
})
export class DestinationRiskModule {}
