import { Module } from '@nestjs/common';
import { MaydayService } from './mayday.service';
import { MaydayController } from './mayday.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { MaydayRecords } from './entities/mayday-records.entity';
import { JwtService } from '@nestjs/jwt';
import { Scores } from 'src/common/entities/scores.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Location, MaydayRecords, Scores])],
  controllers: [MaydayController],
  providers: [MaydayService, JwtService],
})
export class MaydayModule {}
