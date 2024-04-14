import { Body, Controller, Get, Query } from '@nestjs/common';
import { DestinationRiskService } from './destination-risk.service';
import { LocationDto } from 'src/users/dto/user-location.dto';

@Controller('destination-risk')
export class DestinationRiskController {
    constructor (private readonly destinationRiskService : DestinationRiskService) {}

    // 위험도 조회
    @Get('get')
    async findRisk (@Query('destination') destination : string) {
        const findRisk = await this.destinationRiskService.findRisk(destination)
        return findRisk
    }

    // 목적지(와 가장 가까운 곳의) 위험도 조회
    @Get('closest')
    async getDestinationRisk (@Query('destination') destination : string) {
    const destinationRisk = await this.destinationRiskService.getDestinationRisk(destination)
    return destinationRisk
    }

    // 좌표로 지역명 받아오기
    @Get()
    async getUserCoordinate (@Body() locationDto : LocationDto) {
    const myLocation = await this.destinationRiskService.getUserCoordinate(locationDto)
    return myLocation
    }

    // 목적지, 위도, 경도만 저장
    @Get('save')
    async savedDestination (@Query('destination') destination : string) {
        await this.destinationRiskService.savedDestination(destination)
    }
}
