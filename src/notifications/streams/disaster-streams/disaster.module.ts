import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DisasterData } from "src/common/entities/disaster-data.entity";
import { DisasterService } from "./disaster.service";
import { DisasterController } from "./disaster.controller";
import { RedisService } from "src/notifications/redis/redis.service";

@Module({
    imports : [
        TypeOrmModule.forFeature([DisasterData]),
    ],
    providers : [DisasterService, RedisService],
    controllers : [DisasterController]
})
export class DisasterModule {}