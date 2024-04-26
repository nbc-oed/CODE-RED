import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Destination } from 'src/common/entities/destination.entity';
import { Repository } from 'typeorm';
import convert from 'xml-js'

@Injectable()
export class DestinationRiskService {
    constructor (
        private configService: ConfigService,
        private httpService: HttpService,
        @InjectRepository(Destination)
        private destinationRepository : Repository<Destination>
    ) {}

    // 위험도 조회 (from checkDestinationRisk)
    async findRisk (destination : string) {
      try {
        const realTimeDataJsonVer = await this.seoulCityDataXmlToJson(destination)
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
             '예상 인구' : `약 ${predictedPopulation}명,  (${areaName} 기준 )`,
             '기준 시간' : `${populationTrends.FCST_TIME._text}기준`
        }
        return realTimeDestinationRiskData
      } catch (error) {
        console.error('해당 데이터를 찾지 못했습니다.', error)
        throw error
      }   
    }

    // 상세 조회 (from destinationRiskDetailedInquiry)
    async detailCheck (destination : string) {
      try {
        const realTimeDataJsonVer = await this.seoulCityDataXmlToJson(destination)
        const areaName = realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['AREA_NM']['_text']
        const areaCongestLvlMsg = realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['LIVE_PPLTN_STTS']['LIVE_PPLTN_STTS']

        // 인구 추이는 가장 최근 시간대 기준(12:30이면 13시 기준)
        const populationTrends = realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['LIVE_PPLTN_STTS']['LIVE_PPLTN_STTS']['FCST_PPLTN']['FCST_PPLTN'][0]
        const minPredictedPopulation = populationTrends.FCST_PPLTN_MIN._text
        const maxPredictedPopulation = populationTrends.FCST_PPLTN_MAX._text
        const destinationRainOrSnowNews = realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['WEATHER_STTS']['WEATHER_STTS']

        // 중간에 클라이언트한테 리턴 하는 로직 전에 db에 저장-> 키워드 검색 로직
        const realTimeDestinationRiskDetailInquiry = {
             '기준 장소' : areaName,
             '실시간 장소 혼잡도' : areaCongestLvlMsg.AREA_CONGEST_LVL._text,
             '관련 안내사항' : areaCongestLvlMsg.AREA_CONGEST_MSG._text,
             '예상 인구' : `약 ${minPredictedPopulation}명 ~ ${maxPredictedPopulation}명, (${areaName} 기준 )`,
             '기준 시간' : `${populationTrends.FCST_TIME._text}기준`,
             '비,눈 관련 사항' : ` ${destinationRainOrSnowNews.PCP_MSG._text}   ${destinationRainOrSnowNews.WEATHER_TIME._text} 기준`
        }
        return realTimeDestinationRiskDetailInquiry
      } catch (error) {
        console.error('해당 데이터를 찾지 못했습니다.', error)
        throw error
      }  
    }

    /**
     * 목적지(와 가장 가까운 곳의) 위험도 조회 (메인화면 : 인구 밀집도, 인구 추이)
     * 목적지를 값으로 받고, 그 값을 getCoordinate 함수로 보내서 경도,위도를 받아옴(키워드 검색-> 유사 값의 경도,위도 추출)
     * 받은 경도,위도와 미리 DB에 다운 받은 데이터를 바탕으로 서울시에서 정한 115곳 중 1000m 이내에 있으면서 가장 가까운 장소를 가져옴
     * 가장 가까운 장소를 받았으면 findRisk 함수로 장소 이름을 보낸 다음 findRisk는 seoulCityDataXmlToJson로 목적지를 보내서 json으로 변환후 findRisk로 리턴,
     * 리턴 받은 받은 findRisk는 데이터 가공 후 checkDestinationRisk로 반환
     * 남양주에서의 테스트 때문에 임시로 30km로 설정
    */
    async checkDestinationRisk (destination : string) {
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
            ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(destination.longitude, destination.latitude), 4326)::geography,
            :distanceThreshold
          )`,
          { distanceThreshold }
        )
        .orderBy('distance_meters', 'ASC')
        .limit(1)
        .getRawOne();
      if (closeToDestination) {
        const destinationRisk = await this.findRisk(closeToDestination.area_name)
        return destinationRisk;
      } else {
        return { message : '1km 안에 가까운 장소가 없습니다.'}
      }
    } catch (err) {
      console.error('An error occurred while finding destination:', err);
      return 'Failed';
    }
    }

    // 목적지 위험도 상세조회 (목적지 위험도 조회 상세 페이지)
    async destinationRiskDetailedInquiry (destination : string) {
      const coordinate = await this.getCoordinate(destination)
      const { longitude, latitude } = coordinate
      try{
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
            ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(destination.longitude, destination.latitude), 4326)::geography,
            :distanceThreshold
          )`,
          { distanceThreshold }
        )
        .orderBy('distance_meters', 'ASC')
        .limit(1)
        .getRawOne();
        if (closeToDestination) {
          const realTimeDestinationRiskDetailInquiry = await this.detailCheck(closeToDestination.area_name)
          return realTimeDestinationRiskDetailInquiry;
        } else {
          return { message : '1km 안에 가까운 장소가 없습니다.'}
        }
      } catch (err) {
        console.error('An error occurred while finding destination:', err);
        return 'Failed';
      }
      

    }

    // 좌표로 지역명 받아오기 (메인 화면 : 나의 현재 위치)
    async getUserCoordinate (longitude : number, latitude : number) {
    const myLocation = await this.getAreaCoordinates( longitude, latitude );
    return myLocation
    }

    // 역 지오코딩(좌표->지역명(리,동) 변환) (from getUserCoordinate)
    async getAreaCoordinates(longitude: number, latitude: number ) {
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
    async getUserRegionCoordinate (longitude : number, latitude : number) {
    const myRegion = await this.getRegionCoordinates( longitude, latitude );
    return myRegion 
    }

    // 역 지오코딩2 (좌표 -> 지역명(도,시) 변환) (from getUserRegionCoordinate)
    async getRegionCoordinates (longitude: number, latitude: number ) {
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

    // 서울시 주요 115곳 장소 데이터 저장
    // 공백,특수 문자등을 정확하게 전달하기 위해 encodeURIComponent 메서드 사용
    // 데이터 받아서 xml->json 변환한 다음 필요한 데이터에 접근해서 변수에 할당 후 데이터 형식에 맞게 저장
    async savedDestination () {
      const destinationArr = [
        '강남 MICE 관광특구', '동대문 관광특구', '명동 관광특구', '이태원 관광특구', '잠실 관광특구', '종로·청계 관광특구', '홍대 관광특구', '경복궁', '광화문·덕수궁', '보신각',
        '서울 암사동 유적', '창덕궁·종묘', '가산디지털단지역', '강남역', '건대입구역', '고덕역', '고속터미널역', '교대역', '구로디지털단지역', '구로역',
        '군자역', '남구로역', '대림역', '동대문역', '뚝섬역', '미아사거리역', '발산역', '북한산우이역', '사당역', '삼각지역',
        '서울대입구역', '서울식물원·마곡나루역', '서울역', '선릉역', '성신여대입구역', '수유역', '신논현역·논현역', '신도림역', '신림역', '신촌·이대역',
        '양재역', '역삼역', '연신내역', '오목교역·목동운동장', '왕십리역', '용산역', '이태원역', '장지역', '장한평역', '천호역',
        '총신대입구(이수)역', '충정로역', '합정역', '합정역', '혜화역', '홍대입구역(2호선)', '회기역', '4·19 카페거리', '가락시장', '가로수길', '광장(전통)시장',
        '김포공항', '낙산공원·이화마을', '노량진', '덕수궁길·정동길', '방배역 먹자골목', '북촌한옥마을', '서촌', '성수카페거리', '수유리 먹자골목', '쌍문동 맛집거리',
        '압구정로데오거리', '여의도', '연남동', '영등포 타임스퀘어', '외대앞', '용리단길', '이태원 앤틱가구거리', '인사동·익선동', '창동 신경제 중심지', '청담동 명품거리',
        '청량리 제기동 일대 전통시장', '해방촌·경리단길', 'DDP(동대문디자인플라자)', 'DMC(디지털미디어시티)', '강서한강공원', '고척돔', '광나루한강공원', '광화문광장', '국립중앙박물관·용산가족공원', '난지한강공원',
        '남산공원', '노들섬', '뚝섬한강공원', '망원한강공원', '반포한강공원', '북서울꿈의숲', '불광천', '서리풀공원·몽마르뜨공원', '서울광장', '서울대공원', 
        '서울숲공원', '아차산', '양화한강공원', '어린이대공원', '여의도한강공원', '월드컵공원', '응봉산', '이촌한강공원', '잠실종합운동장', '잠실한강공원',
        '잠원한강공원', '청계산', '청와대', '북창동 먹자골목', '남대문시장'
      ]
      for (const destination of destinationArr) {
       try {
        const realTimeDataJsonVer = await this.seoulCityDataXmlToJson(destination)
        const areaName = realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['AREA_NM']['_text'];
        const areaCode = realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['AREA_CD']['_text'];

        // 지하철, 정류장 좌표 둘 다 없고 도로 좌표가 하나라면
        if ((realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['SUB_STTS'] === undefined ||
        Object.keys(realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['SUB_STTS']).length === 0) &&
        (realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['BUS_STN_STTS'] === undefined ||
        Object.keys(realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['BUS_STN_STTS']).length === 0) &&
        realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['ROAD_TRAFFIC_STTS']['ROAD_TRAFFIC_STTS'][0] === undefined)
        {
          // x,y가 같이 들어있기 때문에 나눔
          console.log(realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['ROAD_TRAFFIC_STTS']['ROAD_TRAFFIC_STTS'][0])
          const xyCoordinates = realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['ROAD_TRAFFIC_STTS']['ROAD_TRAFFIC_STTS']['START_ND_XY']['_text']
          const coordinates = xyCoordinates.split('_')
          const savedDestination = {
            areaName, areaCode, xCoordinate: coordinates[0], yCoordinate: coordinates[1],
          }
          const findDestination = await this.destinationRepository.findOne({ 
            where : {
              area_code : savedDestination.areaCode
            }
          })
          if (findDestination) {
            await this.updatedDestination(findDestination.area_code)
          } else {
            await this.destinationRepository.save({
            area_name : areaName,
            area_code : areaCode,
            longitude : parseFloat(coordinates[0]),
            latitude : parseFloat(coordinates[1])
            })
          }
        }
        // 지하철, 정류장 좌표 둘 다 없고 도로 좌표가 여러개라면
        else if ((realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['SUB_STTS'] === undefined ||
        Object.keys(realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['SUB_STTS']).length === 0) &&
        (realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['BUS_STN_STTS'] === undefined ||
        Object.keys(realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['BUS_STN_STTS']).length === 0) ||
        realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['ROAD_TRAFFIC_STTS']['ROAD_TRAFFIC_STTS'][0])
        {
          const xyCoordinates = realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['ROAD_TRAFFIC_STTS']['ROAD_TRAFFIC_STTS'][0]['START_ND_XY']['_text']
          const coordinates = xyCoordinates.split('_')
          const savedDestination = {
            areaName, areaCode, xCoordinate: coordinates[0], yCoordinate: coordinates[1],
          }
          const findDestination = await this.destinationRepository.findOne({ 
            where : {
              area_code : savedDestination.areaCode
            }
          })
          if (findDestination) {
            await this.updatedDestination(findDestination.area_code)
          } else {
            await this.destinationRepository.save({
            area_name : areaName,
            area_code : areaCode,
            longitude : parseFloat(coordinates[0]),
            latitude : parseFloat(coordinates[1])
            })
          }
        }
        // 지하철 좌표가 없고 정류장이 하나라면
        else if ((realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['SUB_STTS'] === undefined ||
          Object.keys(realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['SUB_STTS']).length === 0) &&
          realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['BUS_STN_STTS']['BUS_STN_STTS'][0] === undefined)
          {
          const areaLongitude = realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['BUS_STN_STTS']['BUS_STN_STTS']['BUS_STN_X']['_text']
          const areaLatitude = realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['BUS_STN_STTS']['BUS_STN_STTS']['BUS_STN_Y']['_text']
          const savedDestination = {
            areaName, areaCode, areaLongitude, areaLatitude
          }
          const findDestination = await this.destinationRepository.findOne({ 
            where : {
              area_code : savedDestination.areaCode
            }
          })
          if (findDestination) {
            await this.updatedDestination(findDestination.area_code)
          } else {
            await this.destinationRepository.save({
            area_name : areaName,
            area_code : areaCode,
            longitude : parseFloat(areaLongitude),
            latitude : parseFloat(areaLatitude)
            })
          }
        } else if ((realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['SUB_STTS'] === undefined ||
        Object.keys(realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['SUB_STTS']).length === 0) &&
        realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['BUS_STN_STTS']['BUS_STN_STTS'][0])
        {
          const areaLongitude = realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['BUS_STN_STTS']['BUS_STN_STTS'][0]['BUS_STN_X']['_text']
          const areaLatitude = realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['BUS_STN_STTS']['BUS_STN_STTS'][0]['BUS_STN_Y']['_text']
          const savedDestination = {
            areaName, areaCode, areaLongitude, areaLatitude
          }
          const findDestination = await this.destinationRepository.findOne({ 
            where : {
              area_code : savedDestination.areaCode
            }
          })
          if (findDestination) {
            await this.updatedDestination(findDestination.area_code)
          } else {
            await this.destinationRepository.save({
            area_name : areaName,
            area_code : areaCode,
            longitude : parseFloat(areaLongitude),
            latitude : parseFloat(areaLatitude)
          })
          }
        } else if (realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['SUB_STTS']['SUB_STTS'][0] === undefined)
          {
          const areaLongitude = realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['SUB_STTS']['SUB_STTS']['SUB_STN_X']['_text'];
          const areaLatitude = realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['SUB_STTS']['SUB_STTS']['SUB_STN_Y']['_text'];
          const savedDestination = {
            areaName, areaCode, areaLongitude, areaLatitude
          }
          const findDestination = await this.destinationRepository.findOne({ 
            where : {
              area_code : savedDestination.areaCode
            }
          })
          if (findDestination) {
            await this.updatedDestination(findDestination.area_code)
          } else {
            await this.destinationRepository.save({
            area_name : areaName,
            area_code : areaCode,
            longitude : parseFloat(areaLongitude),
            latitude : parseFloat(areaLatitude)
          })
          }
        } else {
          const areaLongitude = realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['SUB_STTS']['SUB_STTS'][0]['SUB_STN_X']['_text'];
          const areaLatitude = realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['SUB_STTS']['SUB_STTS'][0]['SUB_STN_Y']['_text'];
          const savedDestination = {
          areaName, areaCode, areaLongitude, areaLatitude
          }
          const findDestination = await this.destinationRepository.findOne({ 
          where : {
            area_code : savedDestination.areaCode
          }
        })
        if (findDestination) {
          await this.updatedDestination(findDestination.area_code)
        } else {
          await this.destinationRepository.save({
          area_name : areaName,
          area_code : areaCode,
          longitude : parseFloat(areaLongitude),
          latitude : parseFloat(areaLatitude)
          })
          }
        }
      }catch (error) {
      console.error('해당 데이터를 찾지 못했습니다.', error)
      throw error
    } 
    }
  }

    // 서울시 주요 115곳 장소 데이터 업데이트
    async updatedDestination (destination : string) {
      try {
      const realTimeDataJsonVer = await this.seoulCityDataXmlToJson(destination)
      const areaName = realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['AREA_NM']['_text'];
      const areaCode = realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['AREA_CD']['_text'];

      // 지하철, 정류장 좌표 둘 다 없고 도로 좌표가 하나라면
      if ((realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['SUB_STTS'] === undefined ||
      Object.keys(realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['SUB_STTS']).length === 0) &&
      (realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['BUS_STN_STTS'] === undefined ||
      Object.keys(realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['BUS_STN_STTS']).length === 0) &&
      realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['ROAD_TRAFFIC_STTS']['ROAD_TRAFFIC_STTS'][0] === undefined)
      {
        // x,y가 같이 들어있기 때문에 나눔
        const xyCoordinates = realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['ROAD_TRAFFIC_STTS']['ROAD_TRAFFIC_STTS']['START_ND_XY']['_text']
        const coordinates = xyCoordinates.split('_')
        const updatedDestination = {
          areaName, areaCode, xCoordinate: coordinates[0], yCoordinate: coordinates[1],
        }
        const findDestination = await this.destinationRepository.findOne({ 
          where : {
            area_code : updatedDestination.areaCode
          }
        })
        if (findDestination) {
          await this.destinationRepository.update({area_code : updatedDestination.areaCode}, {
            area_name : areaName,
            area_code : areaCode,
            longitude : coordinates[0],
            latitude : coordinates[1]
          })
        } else {
          await this.destinationRepository.save({
            area_name : areaName,
            area_code : areaCode,
            longitude : parseFloat(coordinates[0]),
            latitude : parseFloat(coordinates[1])
          })
        }
      }
      // 지하철, 정류장 좌표 둘 다 없고 도로 좌표가 여러개라면
      else if ((realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['SUB_STTS'] === undefined ||
      Object.keys(realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['SUB_STTS']).length === 0) &&
      (realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['BUS_STN_STTS'] === undefined ||
      Object.keys(realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['BUS_STN_STTS']).length === 0) ||
      realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['ROAD_TRAFFIC_STTS']['ROAD_TRAFFIC_STTS'][0])
      {
        const xyCoordinates = realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['ROAD_TRAFFIC_STTS']['ROAD_TRAFFIC_STTS'][0]['START_ND_XY']['_text']
        const coordinates = xyCoordinates.split('_')
        const updatedDestination = {
          areaName, areaCode, xCoordinate: coordinates[0], yCoordinate: coordinates[1],
        }
        const findDestination = await this.destinationRepository.findOne({ 
          where : {
            area_code : updatedDestination.areaCode
          }
        })
        if (findDestination) {
          await this.destinationRepository.update({area_code : updatedDestination.areaCode}, {
            area_name : areaName,
            area_code : areaCode,
            longitude : coordinates[0],
            latitude : coordinates[1]
          })
        } else {
          await this.destinationRepository.save({
            area_name : areaName,
            area_code : areaCode,
            longitude : parseFloat(coordinates[0]),
            latitude : parseFloat(coordinates[1])
          })
        }
      }
      // 지하철 정보가 없고 버스 정류장 정보가 하나라면
      else if ((realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['SUB_STTS'] === undefined ||
      Object.keys(realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['SUB_STTS']).length === 0) &&
      realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['BUS_STN_STTS']['BUS_STN_STTS'][0] === undefined)
      {
        const areaLongitude = realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['BUS_STN_STTS']['BUS_STN_STTS']['BUS_STN_X']['_text'];
        const areaLatitude = realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['BUS_STN_STTS']['BUS_STN_STTS']['BUS_STN_Y']['_text'];
        const updatedDestination = {
        areaName, areaCode, areaLongitude, areaLatitude
        }
        const findDestination = await this.destinationRepository.findOne({ 
        where : {
          area_code : updatedDestination.areaCode
        }
      })
        if (findDestination) {
          await this.destinationRepository.update({area_code : updatedDestination.areaCode}, {
          area_name : areaName,
          area_code : areaCode,
          longitude : areaLongitude,
          latitude : areaLatitude
        })
        return { message : '업데이트 성공' }
        } else {
          await this.destinationRepository.save({
            area_name : areaName,
            area_code : areaCode,
            longitude : parseFloat(areaLongitude),
            latitude : parseFloat(areaLatitude)
          })
          return { message : '저장 성공'}
        }
      } else if ((realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['SUB_STTS'] === undefined ||
      Object.keys(realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['SUB_STTS']).length === 0) &&
      realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['BUS_STN_STTS']['BUS_STN_STTS'][0])
      {
        const areaLongitude = realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['BUS_STN_STTS']['BUS_STN_STTS'][0]['BUS_STN_X']['_text'];
        const areaLatitude = realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['BUS_STN_STTS']['BUS_STN_STTS'][0]['BUS_STN_Y']['_text'];
        const updatedDestination = {
        areaName, areaCode, areaLongitude, areaLatitude
        }
        const findDestination = await this.destinationRepository.findOne({ 
          where : {
            area_code : updatedDestination.areaCode
          }
        })
        if (findDestination) {
          await this.destinationRepository.update({area_code : updatedDestination.areaCode}, {
          area_name : areaName,
          area_code : areaCode,
          longitude : areaLongitude,
          latitude : areaLatitude
        })
        return { message : '업데이트 성공' }
        } else {
          await this.destinationRepository.save({
            area_name : areaName,
            area_code : areaCode,
            longitude : parseFloat(areaLongitude),
            latitude : parseFloat(areaLatitude)
          })
          return { message : '저장 성공'}
        }
      } else if (realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['SUB_STTS']['SUB_STTS'][0] === undefined)
      {
        const areaLongitude = realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['SUB_STTS']['SUB_STTS']['SUB_STN_X']['_text'];
        const areaLatitude = realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['SUB_STTS']['SUB_STTS']['SUB_STN_Y']['_text'];
        const updatedDestination = {
          areaName, areaCode, areaLongitude, areaLatitude
        }
        const findDestination = await this.destinationRepository.findOne({ 
          where : {
            area_code : updatedDestination.areaCode
          }
        })
        if (findDestination) {
          await this.destinationRepository.update({area_code : updatedDestination.areaCode}, {
          area_name : areaName,
          area_code : areaCode,
          longitude : areaLongitude,
          latitude : areaLatitude
        })
        return { message : '업데이트 성공' }
        } else {
          await this.destinationRepository.save({
            area_name : areaName,
            area_code : areaCode,
            longitude : parseFloat(areaLongitude),
            latitude : parseFloat(areaLatitude)
          })
          return { message : '저장 성공'}
        }
      } else {
        const areaLongitude = realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['SUB_STTS']['SUB_STTS'][0]['SUB_STN_X']['_text'];
        const areaLatitude = realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['SUB_STTS']['SUB_STTS'][0]['SUB_STN_Y']['_text'];
        const updatedDestination = {
          areaName, areaCode, areaLongitude, areaLatitude
        }
        const findDestination = await this.destinationRepository.findOne({ 
          where : {
            area_code : updatedDestination.areaCode
          }
        })
        if (findDestination) {
          await this.destinationRepository.update({area_code : updatedDestination.areaCode}, {
          area_name : areaName,
          area_code : areaCode,
          longitude : areaLongitude,
          latitude : areaLatitude
        })
        return { message : '업데이트 성공' }
        } else {
          await this.destinationRepository.save({
            area_name : areaName,
            area_code : areaCode,
            longitude : parseFloat(areaLongitude),
            latitude : parseFloat(areaLatitude)
          })
          return { message : '저장 성공'}
        }
      }
      } catch (error) {
        console.error('해당 데이터를 찾지 못했습니다.', error)
        throw error
      }
    }

    // 서울시 주요 115곳 장소 데이터 받아와서 xml->json변환 함수
    async seoulCityDataXmlToJson (destination : string) {
      try {
        const seoulRealTimeData = await this.configService.get('REAL_TIME_DATA_API')
        const response = await axios.get(`http://openapi.seoul.go.kr:8088/${seoulRealTimeData}/xml/citydata/1/1/${encodeURIComponent(destination)}`)
        const xmlData = response.data
        const xmlToJsonData = convert.xml2json(xmlData, {
            compact : true,
            spaces : 4
        })
        const realTimeDataJsonVer = JSON.parse(xmlToJsonData)
        return realTimeDataJsonVer
      }catch (error) {
        console.error('해당 데이터를 찾지 못했습니다.', error)
        throw error
      }
    }
}
