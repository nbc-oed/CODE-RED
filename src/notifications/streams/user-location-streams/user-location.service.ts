import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import { RedisKeys } from 'src/notifications/redis/redis.keys';

@Injectable()
export class GeoLocationService {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  /**
   * Producer - 사용자 위치정보 모니터링 (지속적으로 데이터 수집 -> User-Locations-Streams 적재)
   */

  // 1-1. KAKAO API에서 역지오코딩으로 사용자 위치의 지역명 추출하는 로직
  async getAreaFromCoordinates(
    latitude: number,
    longitude: number,
    user_id?: number,
    client_id?: string,
  ): Promise<string> {
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

      const area = `${region1DepthName} ${region2DepthName}`;
      console.log('역지오코딩 완료', area);
      await this.addUserToLocationStream(area, user_id, client_id);
      return area;
    } catch (error) {
      console.error('사용자 위치 정보를 지역 스트림에 추가 실패:', error);
      throw error;
    }
  }

  // 1-2. 사용자 위치 정보를 해당 지역 스트림에 추가
  async addUserToLocationStream(
    area: string,
    user_id?: number,
    client_id?: string,
  ) {
    const userLocationsStreamKey = RedisKeys.userLocationsStream(area);
    const userIdStr = user_id ? user_id.toString() : 'undefined'; // null이나 undefined인 경우 'undefined' 문자열 사용
    const clientIdStr = client_id ? client_id : 'undefined'; // null이나 undefined인 경우 'undefined' 문자열 사용

    await this.redisService.client.xadd(
      userLocationsStreamKey,
      '*',
      'user_id',
      userIdStr,
      'client_id',
      clientIdStr,
    );
  }
}
