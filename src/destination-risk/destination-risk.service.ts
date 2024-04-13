import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { LocationDto } from 'src/users/dto/user-location.dto';
import convert from 'xml-js'

@Injectable()
export class DestinationRiskService {
    constructor (
        private configService: ConfigService,
        private httpService: HttpService
    ) {}

    async getDestinationRisk (destination : string) {
        const seoulRealTimeData = await this.configService.get('REAL_TIME_DATA_API')
        const response = await axios.get(`http://openapi.seoul.go.kr:8088/${seoulRealTimeData}/xml/citydata/1/1/${destination}`)
        const xmlData = response.data
        const xmlToJsonData = convert.xml2json(xmlData, {
            compact : true,
            spaces : 4
        })
        const realTimeDataJsonVer = JSON.parse(xmlToJsonData)
        const areaName = realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['AREA_NM']['_text']
        const areaCongestLvlMsg = realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['LIVE_PPLTN_STTS']['LIVE_PPLTN_STTS']

        // 인구 추이는 가장 최근 시간대 기준(12:30이면 13시 기준)
        // 임의로 예측 실시간 인구 지표 최소값과 예측 실시간 인구 지표 최대값의 평균 값으로 나타내었음
        // '인구 추이' : `${populationTrends.FCST_TIME._text}기준 약 ${predictedPopulation}명` 으로 변경해서 기준 시간대 표현도 생각해봄직함
        const populationTrends =
        realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['LIVE_PPLTN_STTS']['LIVE_PPLTN_STTS']['FCST_PPLTN']['FCST_PPLTN'][0]
        const predictedPopulation = (parseInt(populationTrends.FCST_PPLTN_MIN._text) + parseInt(populationTrends.FCST_PPLTN_MAX._text)) /2
        const realTimeDestinationRiskData = {
             '목적지' : areaName,
             '실시간 장소 혼잡도' : areaCongestLvlMsg.AREA_CONGEST_LVL._text,
             '관련 안내사항' : areaCongestLvlMsg.AREA_CONGEST_MSG._text,
             '예상 인구' : `약 ${predictedPopulation}명, ${populationTrends.FCST_TIME._text}기준`
        }
        return realTimeDestinationRiskData
    }

    async getUserCoordinate (locationDto : LocationDto) {
    const myLocation = await this.getAreaCoordinates(
            locationDto.userId,
            locationDto.latitude,
            locationDto.longitude,
          );
    return myLocation
    }

    async getAreaCoordinates(userId: number, latitude: number, longitude: number) {
        try {
            const apiKey = this.configService.get<string>('KAKAO_REST_API_KEY');
            const response = await this.httpService
              .get(
                `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${longitude}&y=${latitude}`,
                {
                  headers: {
                    Authorization: `KakaoAK ${apiKey}`,
                  },
                },
              )
              .toPromise();
      
            const region1DepthName = response.data.documents[0].region_1depth_name;
            const region2DepthName = response.data.documents[0].region_2depth_name;
            const region3DepthName = response.data.documents[0].region_3depth_name;
            const area = `${region1DepthName} ${region2DepthName} ${region3DepthName}`;
      
            return area;
          } catch (error) {
            console.error('사용자 위치 정보를 지역 스트림에 추가 실패:', error);
            throw error;
          }
    }
}
