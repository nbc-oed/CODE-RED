import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shelters } from 'src/common/entities/shelters.entity';
import { SheltersService } from './shelters.service';
import { SheltersController } from './shelters.controller';
import { MaydayService } from 'src/mayday/mayday.service';
import { Location } from '../mayday/entities/location.entity';
import { MaydayRecords } from 'src/mayday/entities/mayday-records.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Location, Shelters, MaydayRecords])
    ],
    providers : [SheltersService, MaydayService],
    controllers : [SheltersController]
})
export class SheltersModule {}
