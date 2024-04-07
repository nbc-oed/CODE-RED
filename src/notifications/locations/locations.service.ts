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

      const area = response.data.documents[0].address_name;
      await this.createStreamAndAssignUser(area, userId);
      return area;
    } catch (error) {
      console.error('Error fetching area from coordinates:', error);
      throw error;
    }
  }

  async createStreamAndAssignUser(area: string, userId: number) {
    try {
      const streamKey = `stream:${area}`;
      const groupName = 'consumer-group'; // 공통 소비자 그룹 이름

      // 컨슈머 그룹 생성
      try {
        // 스트림이 존재하지 않으면 더미 데이터로 초기화
        const streamExists = await this.redisService.client.exists(streamKey);
        if (!streamExists) {
          await this.redisService.client.xadd(streamKey, '*', 'init', '1');
        } else {
          await this.redisService.client.xgroup(
            'CREATE',
            streamKey,
            groupName,
            '$',
            'MKSTREAM',
          );
        }
      } catch (error) {
        if (
          !error.message.includes(
            'BUSYGROUP Consumer Group name already exists',
          )
        ) {
          throw error;
        }
      }

      // 사용자를 스트림에 추가
      await this.redisService.client.xadd(
        streamKey,
        '*',
        'userId',
        userId.toString(),
      );
    } catch (error) {
      console.error('Error creating stream and assigning user:', error);
      throw error;
    }
  }
}
