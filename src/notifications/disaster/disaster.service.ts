import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class DisasterService {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  @Cron('0 */30 * * * *') // 매 30분마다 실행
  async handleCron() {
    const disasterData = await this.fetchDisasterData();
    for (const data of disasterData) {
      await this.publishDisasterData(data);
    }
  }

  private async fetchDisasterData() {
    // 공공 데이터 API로부터 재난 문자 데이터를 가져오는 로직 구현
    const apiKey = this.configService.get<string>('DISASTER_API_KEY');
    const apiEndPoint = this.configService.get<string>('API_ENDPOINT');
    const response = await this.httpService
      .get(apiEndPoint, { headers: { Authorization: apiKey } })
      .toPromise();
    return response.data;
  }

  private async publishDisasterData(data: { region: string; message: string }) {
    const streamKey = `stream:${data.region}`;
    await this.redisService.client.xadd(
      streamKey,
      '*',
      'message',
      JSON.stringify(data.message),
    );
  }
}
