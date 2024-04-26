import { Controller, Get, Query, Render } from '@nestjs/common';
import { SheltersService } from './shelters.service';

@Controller('shelters')
export class SheltersController {
  constructor(private sheltersService: SheltersService) {}

  @Get('data')
  async getShelters() {
    await this.sheltersService.getShelters();
    return { message: '데이터 저장 완료' };
  }

    @Get('searchMap')
    async getSheltersMap (@Query('search') search : string) {
        const findShelterData = await this.sheltersService.getSheltersMap(search)
        return findShelterData
    }

    // 내 위치 기반 가장 가까운 대피소 표시 (메인화면 표시용)
    @Get('nearby')
    async closeToShelter (@Query('x') x : string, @Query('y') y : string
    ) {
        const longitude = parseFloat(x)
        const latitude = parseFloat(y)
        const shelter = await this.sheltersService.closeToShelter(longitude, latitude)

        if (!shelter || shelter.length === 0) {
            return [];
        }
        
        return shelter
    }

    // 사용자 위치로 부터 1km내 대피소 모두 조회 (주변 대피소 찾기 시작화면용)
    @Get('around')
    @Render('shelters/shelters')
    async myLocationShelterAround (
      //@Query('x') x : string, @Query('y') y : string
    ) {
      let longitude = 127.300616,
      latitude = 37.657918
        //const longitude = parseFloat(x)
        //const latitude = parseFloat(y)
        const shelter = await this.sheltersService.myLocationShelterAround(longitude, latitude)

        return { shelter : shelter }
    }

    @Get('mix')
    async sheltersMapOrLocationShelterAround (@Query() query) {
        if (query.search) {
            const findShelterData = await this.sheltersService.getSheltersMap(query.search);
            console.log("-----------------", findShelterData)
            return { findShelterData : findShelterData};
        } else if (query.x && query.y) {
            const longitude = parseFloat(query.x);
            const latitude = parseFloat(query.y);
            const shelter = await this.sheltersService.myLocationShelterAround(longitude, latitude);
            return { shelter : shelter};
          } else {
            return { message: "적절한 쿼리 파라미터를 제공해주세요." };
          }
    }
}
