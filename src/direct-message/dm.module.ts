import { Module } from '@nestjs/common';
import { DmGateway } from './dm.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DirectMessages } from '../common/entities/direct-messages.entity';
import { DmController } from './dm.controller';
import { DmService } from './dm.service';
import { Users } from 'src/common/entities/users.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { ScheduleModule } from '@nestjs/schedule';
import { UtilsModule } from 'src/utils/utils.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DirectMessages, Users]),
    ScheduleModule.forRoot(),
    NotificationsModule,
    UtilsModule,
  ],
  controllers: [DmController],
  providers: [DmGateway, DmService],
})
export class DmModule {}
