import { Controller, Get, Query } from '@nestjs/common';
import { SheltersService } from './shelters.service';
import { UserInfo } from 'src/common/decorator/user.decorator';
import { Users } from 'src/common/entities/users.entity';

@Controller('shelters')
export class SheltersController {
    constructor (private sheltersService : SheltersService) {}

    @Get('data')
    async getShelters () {
        await this.sheltersService.getShelters()
        return { message : "데이터 저장 완료" }
    }

    @Get('searchMap')
    async getSheltersMap (@Query('search') search : string) {
        const findShelterData = await this.sheltersService.getSheltersMap(search)
        return findShelterData
    }

    // 내 위치 기반 가까운 대피소 표시
    @Get('nearby')
    async closeToShelter (@Query('id')id : string,
        //@UserInfo() user: Users 최종 완성시 주석 해제해서 쿼리 대신 써야함
    ) {
        const userId = parseInt(id)
        const shelter = await this.sheltersService.closeToShelter(userId)
        return shelter
    }

    // 사용자 위치로 부터 1km내 대피소 모두 조회
    @Get('around')
    async myLocationShelterAround (@Query('id') id : string
        //@UserInfo() user: Users 최종 완성시 주석 해제해서 쿼리 대신 써야함
    ) {
        const userId = parseInt(id)
        const shelter = await this.sheltersService.myLocationShelterAround(userId)
        return shelter
    }
}