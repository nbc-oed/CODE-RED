import { Module } from '@nestjs/common';
import { MaydayService } from './mayday.service';
import { MaydayController } from './mayday.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { MaydayRecords } from './entities/mayday-records.entity';
import { QueueModule } from 'src/notifications/queue/queue.module';

@Module({
  imports: [TypeOrmModule.forFeature([Location, MaydayRecords]), QueueModule],
  controllers: [MaydayController],
  providers: [MaydayService],
  exports: [MaydayService],
})
export class MaydayModule {}
