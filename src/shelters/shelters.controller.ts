import { Controller, Get } from '@nestjs/common';
import { SheltersService } from './shelters.service';

@Controller('shelters')
export class SheltersController {
    constructor (private sheltersService : SheltersService) {}

    @Get()
    async shelters() {
        const shelterInfo = await this.sheltersService.getShelters()
        return shelterInfo
    }
}
