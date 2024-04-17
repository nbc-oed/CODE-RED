import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
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

    // 상세 조회 (목적지 위험도 조회 상세 페이지)
    @Get('detail')
    async detailCheck (@Query('destination') destination : string) {
    const detailCheck = await this.destinationRiskService.destinationRiskDetailedInquiry(destination)
    return detailCheck
    }

    // 목적지(와 가장 가까운 곳의) 위험도 조회
    @Get('check')
    async checkDestinationRisk (@Query('destination') destination : string) {
    const destinationRisk = await this.destinationRiskService.checkDestinationRisk(destination)
    return destinationRisk
    }

    // 좌표로 지역명 받아오기 (역 지오코딩)
    @Get()
    async getUserCoordinate (@Body() locationDto : LocationDto) {
    const myLocation = await this.destinationRiskService.getUserCoordinate(locationDto)
    return myLocation
    }

    // 서울시 주요 115곳 장소 데이터 저장
    @Post('save')
    async savedDestination (@Query('destination') destination : string) {
        await this.destinationRiskService.savedDestination(destination)
    }

    // 서울시 115곳 장소 데이터 업데이트
    @Patch('update')
    async updatedDestination (@Query('destination') destination : string) {
        await this.destinationRiskService.updatedDestination(destination)
    }
}
