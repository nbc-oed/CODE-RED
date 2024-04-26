import { Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { DestinationRiskService } from './destination-risk.service';

@Controller('destination-risk')
export class DestinationRiskController {
    constructor (private readonly destinationRiskService : DestinationRiskService) {}

    // 위험도 조회 
    @Get()
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

    // 목적지(와 가장 가까운 곳의) 위험도 조회 (메인화면 : 인구 밀집도, 인구 추이)
    @Get('check')
    async checkDestinationRisk (@Query('destination') destination : string) {
    const destinationRisk = await this.destinationRiskService.checkDestinationRisk(destination)
    return destinationRisk
    }

    // 좌표로 지역명 받아오기 (역 지오코딩) (메인 화면 : 나의 현재 위치)
    @Get('coordinate')
    async getUserCoordinate (@Query('x') x : string, @Query('y') y : string) {
    const longitude = parseFloat(x)
    const latitude = parseFloat(y)
    const myLocation = await this.destinationRiskService.getUserCoordinate(longitude, latitude)
    return myLocation
    }

    // 역지오코딩2
    @Get('regionCoordinate')
    async getUserRegionCoordinate (@Query('x') x : string, @Query('y') y : string) {
    const longitude = parseFloat(x)
    const latitude = parseFloat(y)
    const myRegion = await this.destinationRiskService.getUserRegionCoordinate(longitude, latitude)
    return myRegion
    }

    @Get('get')
    async getCoordinate (@Query('destination') destination : string) {
    const getCoordinate = await this.destinationRiskService.getCoordinate(destination)
    console.log("--returnCoordinate--",getCoordinate)
    return getCoordinate
    }

    // 서울시 주요 115곳 장소 데이터 저장
    @Post('save')
    async savedDestination () {
        await this.destinationRiskService.savedDestination()
    }

    // 서울시 115곳 장소 데이터 업데이트
    @Patch()
    async updatedDestination (@Query('destination') destination : string) {
        await this.destinationRiskService.updatedDestination(destination)
    }
}
