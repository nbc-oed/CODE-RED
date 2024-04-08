import { Module } from '@nestjs/common';
import { MaydayService } from './mayday.service';
import { MaydayController } from './mayday.controller';

@Module({
  controllers: [MaydayController],
  providers: [MaydayService],
})
export class MaydayModule {}
