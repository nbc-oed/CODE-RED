import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shelters } from 'src/common/entities/shelters.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Shelters])
    ]
})
export class SheltersModule {}
