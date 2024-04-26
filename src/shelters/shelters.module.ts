import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shelters } from 'src/common/entities/shelters.entity';
import { SheltersService } from './shelters.service';
import { SheltersController } from './shelters.controller';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [TypeOrmModule.forFeature([Shelters]),
  ScheduleModule.forRoot()],
  providers: [SheltersService],
  controllers: [SheltersController],
  exports: [SheltersService],
})
export class SheltersModule {}
