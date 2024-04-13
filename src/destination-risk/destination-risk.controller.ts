import { Body, Controller, Get, Query } from '@nestjs/common';
import { DestinationRiskService } from './destination-risk.service';
import { LocationDto } from 'src/users/dto/user-location.dto';

@Controller('destination-risk')
export class DestinationRiskController {
    constructor (private readonly destinationRiskService : DestinationRiskService) {}

    @Get('get')
    async getDestinationRisk (@Query('destination') destination : string) {
        const destinationRisk = await this.destinationRiskService.getDestinationRisk(destination)
        return destinationRisk
    }

    // GPS 기능 탑재
    @Get()
    async getUserCoordinate (@Body() locationDto : LocationDto) {
    const myLocation = await this.destinationRiskService.getUserCoordinate(locationDto)
    return myLocation
    }
}
