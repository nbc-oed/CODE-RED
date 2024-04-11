import { Module } from '@nestjs/common';
import { DmGateway } from './dm.gateway';

@Module({
  providers: [DmGateway],
})
export class DmModule {}
