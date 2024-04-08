import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DisasterData } from 'src/common/entities/disaster-data.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import convert from 'xml-js';

@Injectable()
export class DisasterService {
  constructor(
    @InjectRepository(DisasterData)
    private disasterRepository: Repository<DisasterData>,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS) // 매 3분마다 실행 '* */3 * * * *
  async handleCron() {
    console.log('CRONㅡ스타트');
    const disasterData = await this.fetchDisasterData();
    //await this.disasterRepository.save(disasterData);
  }

  private async fetchDisasterData() {
    // 공공 데이터 API로부터 재난 문자 데이터를 가져오는 로직 구현
    const apiKey = this.configService.get<string>('DISASTER_API_KEY');
    try {
      const response = await axios.get(
        `http://apis.data.go.kr/1741000/DisasterMsg4/getDisasterMsg2List?serviceKey=${apiKey}`,
      );
      const xmlData = response.data;
      const xmlToJsonData = convert.xml2json(xmlData, {
        compact: true,
        spaces: 4,
      });
      const disasterDataJson = JSON.parse(xmlToJsonData);
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
