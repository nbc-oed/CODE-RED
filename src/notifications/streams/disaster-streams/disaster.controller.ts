import { Controller, Get } from "@nestjs/common";
import { DisasterService } from "./disaster.service";

@Controller('disaster')
export class DisasterController {
    constructor (private readonly disasterService : DisasterService) {}

    @Get('data')
    async fetchDisasterData () {
    const result = await this.disasterService.fetchDisasterData()
    return result
    }
}