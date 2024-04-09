import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DisasterData } from 'src/common/entities/disaster-data.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import convert from 'xml-js';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class DisasterService {
  constructor(
    @InjectRepository(DisasterData)
    private disasterRepository: Repository<DisasterData>,
    private httpService: HttpService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS) // 매 3분마다 실행 '* */3 * * * *
  async handleCron() {
    console.log('CRONㅡ스타트');
    const disasterData = await this.fetchDisasterData();
    //await this.disasterRepository.save(disasterData);
    await this.sendDisasterInfoToStreams(disasterData);
  }

  private async fetchDisasterData() {
    // 공공 데이터 API로부터 재난 문자 데이터를 가져오는 로직 구현
    const apiKey = this.configService.get<string>('DISASTER_API_KEY');
    try {
      const response = await axios.get(
        `http://apis.data.go.kr/1741000/DisasterMsg4/getDisasterMsg2List`,
        {
          params: {
            serviceKey: apiKey,
          },
        },
      );

      const xmlData = response.data;
      const xmlToJsonData = convert.xml2json(xmlData, {
        compact: true,
        spaces: 4,
      });
      const disasterDataJson = JSON.parse(xmlToJsonData);

      //API 응답 구조 검증
      if (
        !disasterDataJson ||
        !disasterDataJson['DisasterMsg2'] ||
        !disasterDataJson['DisasterMsg2']['row']
      ) {
        console.error(
          'Invalid data structure:',
          disasterDataJson.OpenAPI_ServiceResponse.cmmMsgHeader.errMsg,
          disasterDataJson.OpenAPI_ServiceResponse.cmmMsgHeader.returnAuthMsg,
        );
        return;
      }

      const resultInRow = disasterDataJson['DisasterMsg2']['row'];

      // 재난 문자 생성일 날짜 형식 변환
      const currentDate = new Date();
      const currentDateString = currentDate
        .toISOString()
        .split('T')[0]
        .replace(/-/g, '/');

      const result = resultInRow
        .map((element) => {
          // 지역명 필터링
          const categories = element.location_name._text
            .split(',')
            .map((name) => name.trim());

          return {
            id: parseInt(element.location_id._text),
            large_category: categories,
            message: element.msg._text,
            send_platform: element.send_platform._text,
            send_datetime: element.create_date._text,
          };
        })
        .filter((item) => {
          // 특정 키워드 배제 필터링
          const keywords = ['실종', '배회', '찾습니다'];
          // 함수 실행 시점 기준으로 필터링
          const messageDate = item.send_datetime.split(' ')[0];
          return (
            !keywords.some((keyword) => item.message.includes(keyword)) &&
            messageDate === currentDateString
          );
        });
      console.log('result----------------------', result);

      return result;
    } catch (error) {
      console.log('axios 에러', error);
    }
  }

  async sendDisasterInfoToStreams(disasterData: any) {
    // 이중 for문으로 지역명 형식 통일
    for (const data of disasterData) {
      for (const area of data.large_category) {
        const streamKey = `stream:${area}`;

        try {
          // 지역명 Stream의 존재여부에 따라 수신한 데이터 추가하고 타임스탬프를 업데이트하는 로직
          const streamExists = await this.redisService.client.exists(streamKey);
          if (streamExists) {
            // 존재한다면, 가장 최신의 데이터를 추가
            await this.addLatestDataToExistingStream(data, area);
          } else {
            // 존재하지 않는다면, 자동으로 데이터를 추가
            await this.addDataToStream(data, area);
          }
        } catch (error) {
          // NOKEY 에러가 발생할 경우, 더미 데이터를 추가한 다음부터 수신한 데이터 추가
          if (error.message.includes('NOKEY')) {
            await this.initializeStream(streamKey);
            await this.addDataToStream(data, area);
          } else {
            throw error;
          }
        }
      }
    }
  }

  async initializeStream(streamKey: string) {
    await this.redisService.client.xadd(streamKey, '*', 'init', '1');
  }

  async addDataToStream(data: any, area: string) {
    const streamKey = `stream:${area}`;
    await this.redisService.client.xadd(
      streamKey,
      '*',
      'message',
      JSON.stringify(data),
    );
    await this.updateLastTimestamp(streamKey, data.send_datetime);
  }

  async updateLastTimestamp(streamKey: string, timestamp: string) {
    const lastTimestampKey = `${streamKey}:lastTimestamp`;
    await this.redisService.client.set(lastTimestampKey, timestamp);
  }

  async addLatestDataToExistingStream(data: any, area: string) {
    const streamKey = `stream:${area}`;
    const lastTimestampKey = `${streamKey}:lastTimestamp`;
    const lastTimestamp = await this.redisService.client.get(lastTimestampKey);

    if (
      !lastTimestamp ||
      new Date(data.send_datetime) > new Date(lastTimestamp)
    ) {
      await this.redisService.client.xadd(
        streamKey,
        '*',
        'message',
        JSON.stringify(data),
      );
      await this.redisService.client.set(lastTimestampKey, data.send_datetime);
    }
  }
}
