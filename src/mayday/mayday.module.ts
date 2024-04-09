import { Module } from '@nestjs/common';
import { MaydayService } from './mayday.service';
import { MaydayController } from './mayday.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { MaydayRecords } from './entities/mayday-records.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Location, MaydayRecords])],
  controllers: [MaydayController],
  providers: [MaydayService],
})
export class MaydayModule {}
