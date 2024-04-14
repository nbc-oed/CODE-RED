import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Destination } from 'src/common/entities/destination.entity';
import { MaydayService } from 'src/mayday/mayday.service';
import { LocationDto } from 'src/users/dto/user-location.dto';
import { Repository } from 'typeorm';
import convert from 'xml-js'

@Injectable()
export class DestinationRiskService {
    constructor (
        private configService: ConfigService,
        private httpService: HttpService,
        private maydayService : MaydayService,
        @InjectRepository(Destination)
        private destinationRepository : Repository<Destination>
    ) {}

    // 위험도 조회
    async findRisk (destination : string) {
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

        // 중간에 클라이언트한테 리턴 하는 로직 전에 db에 저장-> 키워드 검색 로직
        const realTimeDestinationRiskData = {
             '기준 장소' : areaName,
             '실시간 장소 혼잡도' : areaCongestLvlMsg.AREA_CONGEST_LVL._text,
             '관련 안내사항' : areaCongestLvlMsg.AREA_CONGEST_MSG._text,
             '예상 인구' : `약 ${predictedPopulation}명, ${populationTrends.FCST_TIME._text}기준`
        }
        return realTimeDestinationRiskData
    }

    // 목적지(와 가장 가까운 곳의) 위험도 조회
    // 목적지를 값으로 받고, 그 값을 getCoordinate 함수로 보내서 경도,위도를 받아옴(키워드 검색-> 유사 값의 경도,위도 추출)
    // 받은 경도,위도와 미리 DB에 다운 받은 데이터를 바탕으로 서울시에서 정한 115곳 중 1000m 이내에 있으면서 가장 가까운 장소를 가져옴
    // 가장 가까운 장소를 받았으면 findRisk 함수로 장소 이름을 보낸 다음 데이터 가공 후 반환
    async getDestinationRisk (destination : string) {
    const coordinate = await this.getCoordinate(destination)
    const { longitude, latitude } = coordinate
    try {
      const distanceThreshold = 1000;
      const closeToDestination = await this.destinationRepository
        .createQueryBuilder('destination')
        .select('destination.area_name', 'area_name')
        .addSelect(`ST_Distance(
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(destination.longitude, destination.latitude), 4326)::geography
          )`, 'distance_meters')
        .setParameter('longitude', longitude)
        .setParameter('latitude', latitude)
        .where(
          `ST_DWithin(
            ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326),
            ST_SetSRID(ST_MakePoint(destination.longitude, destination.latitude), 4326),
            :distanceThreshold
          )`,
          { distanceThreshold }
        )
        .orderBy('distance_meters', 'ASC')
        .limit(1)
        .getRawOne();
      if (closeToDestination.distance_meters < 1000) {
        console.log(closeToDestination)
        const destinationRisk = await this.findRisk(closeToDestination.area_name)
        return destinationRisk;
      } else {
        console.log('1km 안에 가까운 장소가 없습니다.');
        return { message : '1km 안에 가까운 장소가 없습니다.'}
      }
    } catch (err) {
      console.error('An error occurred while finding destination:', err);
      return 'Failed';
    }
    }

    // 좌표로 지역명 받아오기
    async getUserCoordinate (locationDto : LocationDto) {
    const { userId } = locationDto
    await this.maydayService.saveMyLocation( locationDto, userId )
    const myLocation = await this.getAreaCoordinates(
            userId,
            locationDto.latitude,
            locationDto.longitude,
          );
    return myLocation
    }

    // 역 지오코딩(좌표->지역명 변환)
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
            const region4DepthName = response.data.documents[0].region_4depth_name;
            const area = `${region1DepthName} ${region2DepthName} ${region3DepthName} ${region4DepthName}`;
      
            return area;
          } catch (error) {
            console.error('사용자 위치 정보를 지역 스트림에 추가 실패:', error);
            throw error;
          }
    }

    // 목적지의 위도,경도 추출
    // 키워드 검색을 통해 최대한 유사한 장소를 검색하고 그 안에서 x,y(경도,위도)를 추출 후 값을 반환
    async getCoordinate (destination : string): Promise<{ longitude: string; latitude: string }> {
      try {
        const apiKey = this.configService.get('KAKAO_REST_API_KEY')
        const response = await axios.get(`https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(destination)}`,{
          headers : {
            Authorization : `KakaoAK ${apiKey}`
          }
        })

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

    // 장소명,위도,경도만 저장
    async savedDestination (destination : string) {
      try {
        const seoulRealTimeData = await this.configService.get('REAL_TIME_DATA_API')
        const response = await axios.get(`http://openapi.seoul.go.kr:8088/${seoulRealTimeData}/xml/citydata/1/1/${encodeURIComponent(destination)}`)
        const xmlData = response.data
        const xmlToJsonData = convert.xml2json(xmlData, {
            compact : true,
            spaces : 4
        })
        const realTimeDataJsonVer = JSON.parse(xmlToJsonData)
        const areaName = realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['AREA_NM']['_text'];
        console.log("-------------------",realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['SUB_STTS']['SUB_STTS'][0]['SUB_STN_X']['_text'])
        const areaLongitude = realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['SUB_STTS']['SUB_STTS'][0]['SUB_STN_X']['_text'];
        const areaLatitude = realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['SUB_STTS']['SUB_STTS'][0]['SUB_STN_Y']['_text'];
        await this.destinationRepository.save({
          area_name : areaName,
          longitude : parseFloat(areaLongitude),
          latitude : parseFloat(areaLatitude)
        })
      }catch (error) {
      console.error('해당 데이터를 찾지 못했습니다.', error)
      throw error
    }
    } 
}
