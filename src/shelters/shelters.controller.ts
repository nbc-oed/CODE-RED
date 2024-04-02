import { Controller, Get, Post } from '@nestjs/common';
import { SheltersService } from './shelters.service';

@Controller('shelters')
export class SheltersController {
    constructor (private sheltersService : SheltersService) {}

    @Get()
    async getShelters () {
        const shelters = await this.sheltersService.getShelters()
        return { message : "데이터 저장 완료" }
    }
}
