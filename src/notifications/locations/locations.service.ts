import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class GeoLocationService {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async getAreaFromCoordinates(
    userId: number,
    latitude: number,
    longitude: number,
  ): Promise<string> {
    try {
      // KAKAO API에서 역지오코딩으로 사용자 위치의 지역명 추출하는 로직
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

      // 추출한 사용자 위치 정보를 해당 지역 스트림에 추가하는 로직
      await this.addUserToLocationStream(area, userId);
      return area;
    } catch (error) {
      console.error('사용자 위치 정보를 지역 스트림에 추가 실패:', error);
      throw error;
    }
  }

  async addUserToLocationStream(area: string, userId: number) {
    const locationStreamKey = `locationStream:${area}`;
    // 사용자 위치 정보를 해당 지역 스트림에 추가
    await this.redisService.client.xadd(
      locationStreamKey,
      '*',
      'userId',
      userId.toString(),
    );
  }
}
