import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import _ from 'lodash';
import { Destination } from 'src/common/entities/destination.entity';
import { destinationKeywords } from 'src/utils/keywords';
import { Repository } from 'typeorm';
import convert from 'xml-js';

@Injectable()
export class DestinationRiskService {
  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    @InjectRepository(Destination)
    private destinationRepository: Repository<Destination>,
  ) {}

  // 위험도 조회 (from checkDestinationRisk)
  async findRisk(destination: string) {
    try {
      const realtimeCityData =
        await this.seoulCityDataXmlToJson(destination)['SeoulRtd.citydata'][
          'CITYDATA'
        ];

      const areaName = realtimeCityData['AREA_NM']['_text'];
      const areaCongestLvlMsg =
        realtimeCityData['LIVE_PPLTN_STTS']['LIVE_PPLTN_STTS'];

      // 인구 추이는 가장 최근 시간대 기준(12:30이면 13시 기준)
      // 임의로 예측 실시간 인구 지표 최소값과 예측 실시간 인구 지표 최대값의 평균 값으로 나타내었음
      // '인구 추이' : `${populationTrends.FCST_TIME._text}기준 약 ${predictedPopulation}명` 으로 변경해서 기준 시간대 표현도 생각해봄직함
      const populationTrends = areaCongestLvlMsg['FCST_PPLTN']['FCST_PPLTN'][0];
      const predictedPopulation =
        (parseInt(populationTrends.FCST_PPLTN_MIN._text) +
          parseInt(populationTrends.FCST_PPLTN_MAX._text)) /
        2;

      // 중간에 클라이언트한테 리턴 하는 로직 전에 db에 저장-> 키워드 검색 로직
      const realTimeDestinationRiskData = {
        '기준 장소': areaName,
        '실시간 장소 혼잡도': areaCongestLvlMsg.AREA_CONGEST_LVL._text,
        '관련 안내사항': areaCongestLvlMsg.AREA_CONGEST_MSG._text,
        '예상 인구': `약 ${predictedPopulation}명, (${areaName})`,
        '기준 시간': `${populationTrends.FCST_TIME._text}`,
      };
      return realTimeDestinationRiskData;
    } catch (error) {
      console.error('해당 데이터를 찾지 못했습니다.', error);
      throw error;
    }
  }

  /**
   * 목적지(와 가장 가까운 곳의) 위험도 조회 (메인화면 : 인구 밀집도, 인구 추이)
   * 목적지를 값으로 받고, 그 값을 getCoordinate 함수로 보내서 경도,위도를 받아옴(키워드 검색-> 유사 값의 경도,위도 추출)
   * 받은 경도,위도와 미리 DB에 다운 받은 데이터를 바탕으로 서울시에서 정한 115곳 중 1000m 이내에 있으면서 가장 가까운 장소를 가져옴
   * 가장 가까운 장소를 받았으면 findRisk 함수로 장소 이름을 보낸 다음 findRisk는 seoulCityDataXmlToJson로 목적지를 보내서 json으로 변환후 findRisk로 리턴,
   * 리턴 받은 받은 findRisk는 데이터 가공 후 checkDestinationRisk로 반환
   */
  async checkDestinationRisk(
    destination: string | { longitude: number; latitude: number },
  ) {
    let longitude: number;
    let latitude: number;

    if (typeof destination === 'string') {
      const coordinate = await this.getCoordinate(destination);
      longitude = +coordinate.longitude;
      latitude = +coordinate.latitude;
    } else {
      longitude = destination.longitude;
      latitude = destination.latitude;
    }

    try {
      const distanceThreshold = 5000;
      const closeToDestination = await this.destinationRepository
        .createQueryBuilder('destination')
        .select('destination.area_name', 'area_name')
        .addSelect(
          `ST_Distance(
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(destination.longitude, destination.latitude), 4326)::geography
          )`,
          'distance_meters',
        )
        .setParameter('longitude', longitude)
        .setParameter('latitude', latitude)
        .where(
          `ST_DWithin(
            ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(destination.longitude, destination.latitude), 4326)::geography,
            :distanceThreshold
          )`,
          { distanceThreshold },
        )
        .orderBy('distance_meters', 'ASC')
        .limit(1)
        .getRawOne();

      if (closeToDestination) {
        const destinationRisk = await this.findRisk(
          closeToDestination.area_name,
        );
        return destinationRisk;
      } else {
        return { message: '5km 안에 가까운 장소가 없습니다.' };
      }
    } catch (err) {
      console.error('An error occurred while finding destination:', err);
      return 'Failed';
    }
  }

  // 좌표로 지역명 받아오기 (메인 화면 : 나의 현재 위치)
  async getUserCoordinate(longitude: number, latitude: number) {
    const myLocation = await this.getAreaCoordinates(longitude, latitude);
    return myLocation;
  }

  // 역 지오코딩(좌표->지역명(리,동) 변환) (from getUserCoordinate)
  async getAreaCoordinates(longitude: number, latitude: number) {
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
      const region4DepthName = response.data.documents[0].region_4depth_name;
      const area = `${region1DepthName} ${region2DepthName} ${region3DepthName} ${region4DepthName}`;

      return area;
    } catch (error) {
      console.error('지역명 변환 실패:', error);
      throw error;
    }
  }

  // 좌표로 지역명 받아오기 (서울이 아닐때 내 지역의 재난 메세지 출력을 위해)
  async getUserRegionCoordinate(longitude: number, latitude: number) {
    const myRegion = await this.getRegionCoordinates(longitude, latitude);
    return myRegion;
  }

  // 역 지오코딩2 (좌표 -> 지역명(도,시) 변환) (from getUserRegionCoordinate)
  async getRegionCoordinates(longitude: number, latitude: number) {
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
      const region = `${region1DepthName} ${region2DepthName}`;

      return region;
    } catch (error) {
      console.error('지역명 변환 실패:', error);
      throw error;
    }
  }

  // 목적지의 위도,경도 추출
  // 키워드 검색을 통해 최대한 유사한 장소를 검색하고 그 안에서 x,y(경도,위도)를 추출 후 값을 반환
  async getCoordinate(
    destination: string,
  ): Promise<{ longitude: string; latitude: string }> {
    try {
      const apiKey = this.configService.get('KAKAO_REST_API_KEY');
      const response = await axios.get(
        `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(destination)}`,
        {
          headers: {
            Authorization: `KakaoAK ${apiKey}`,
          },
        },
      );

      const { documents } = response.data;
      if (documents.length === 0) {
        throw new Error('주소에 해당하는 좌표를 찾을 수 없습니다.');
      }
      const { x, y } = documents[0];
      return { longitude: x, latitude: y };
    } catch (error) {
      console.error('데이터를 찾지 못했습니다.:', error);
      throw error;
    }
  }

  // 서울시 주요 115곳 장소 데이터 저장
  // 공백,특수 문자등을 정확하게 전달하기 위해 encodeURIComponent 메서드 사용
  // 데이터 받아서 xml->json 변환한 다음 필요한 데이터에 접근해서 변수에 할당 후 데이터 형식에 맞게 저장
  async saveDestination() {
    const destinationArr = destinationKeywords;

    for (const destination of destinationArr) {
      try {
        const realtimeCityData = (
          await this.seoulCityDataXmlToJson(destination)
        )['SeoulRtd.citydata']['CITYDATA'];
        const areaName = realtimeCityData['AREA_NM']['_text'];
        const areaCode = realtimeCityData['AREA_CD']['_text'];

        const busLocation = realtimeCityData['SUB_STTS'];
        const subwayLocation = realtimeCityData['BUS_STN_STTS'];
        const roadLocation =
          realtimeCityData['ROAD_TRAFFIC_STTS']['ROAD_TRAFFIC_STTS'];

        let coordinates: string[];

        // 지하철, 정류장 좌표 둘 다 없고 도로 좌표가 하나라면
        if (
          _.isEmpty(busLocation) &&
          _.isEmpty(subwayLocation) &&
          !roadLocation[0]
        ) {
          const xyCoordinates = roadLocation['START_ND_XY']['_text'];
          coordinates = xyCoordinates.split('_');
        }
        // 지하철, 정류장 좌표 둘 다 없고 도로 좌표가 여러개라면
        else if (
          (_.isEmpty(busLocation) && _.isEmpty(subwayLocation)) ||
          roadLocation[0]
        ) {
          const xyCoordinates = roadLocation[0]['START_ND_XY']['_text'];
          coordinates = xyCoordinates.split('_');
        }
        // 지하철 좌표가 없고 정류장이 하나라면
        else if (_.isEmpty(busLocation) && !subwayLocation['BUS_STN_STTS'][0]) {
          const longitude =
            subwayLocation['BUS_STN_STTS']['BUS_STN_X']['_text'];
          const latitude = subwayLocation['BUS_STN_STTS']['BUS_STN_Y']['_text'];
          coordinates = [longitude, latitude];
        } else if (!busLocation['SUB_STTS'][0]) {
          const longitude = busLocation['SUB_STTS']['SUB_STN_X']['_text'];
          const latitude = busLocation['SUB_STTS']['SUB_STN_Y']['_text'];
          coordinates = [longitude, latitude];
        } else {
          const longitude = busLocation['SUB_STTS'][0]['SUB_STN_X']['_text'];
          const latitude = busLocation['SUB_STTS'][0]['SUB_STN_Y']['_text'];
          coordinates = [longitude, latitude];
        }

        const existedDestination = await this.destinationRepository.findOneBy({
          area_code: areaCode,
        });
        const destinationData = {
          area_name: areaName,
          area_code: areaCode,
          longitude: parseFloat(coordinates[0]),
          latitude: parseFloat(coordinates[1]),
        };

        if (existedDestination) {
          Object.assign(existedDestination, destinationData);
        }

        await this.destinationRepository.save(destinationData);
      } catch (error) {
        console.error('해당 데이터를 찾지 못했습니다.', error);
        throw error;
      }
    }
  }

  // 서울시 주요 115곳 장소 데이터 받아와서 xml->json변환 함수
  private async seoulCityDataXmlToJson(destination: string) {
    try {
      const seoulRealTimeData =
        await this.configService.get('REAL_TIME_DATA_API');
      const response = await axios.get(
        `http://openapi.seoul.go.kr:8088/${seoulRealTimeData}/xml/citydata/1/1/${encodeURIComponent(destination)}`,
      );
      const xmlData = response.data;
      const xmlToJsonData = convert.xml2json(xmlData, {
        compact: true,
        spaces: 4,
      });
      const realtimeCityData = JSON.parse(xmlToJsonData);
      return realtimeCityData;
    } catch (error) {
      console.error('해당 데이터를 찾지 못했습니다.', error);
      throw error;
    }
  }
}
