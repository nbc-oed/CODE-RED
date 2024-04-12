import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DisasterData } from 'src/common/entities/disaster-data.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import convert from 'xml-js';
import { RedisKeys } from 'src/notifications/redis/redis.keys';

@Injectable()
export class DisasterService {
  private lastFetchedTime: Date;

  constructor(
    @InjectRepository(DisasterData)
    private disasterRepository: Repository<DisasterData>,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {
    this.lastFetchedTime = new Date();
  }

  /**
   * Producer - 공공데이터 재난 문자 모니터링 (지속적으로 데이터 수집 -> Disaster-Streams 적재)
   *
   * 추가 변경사항
   * - any 타입 -> 명확한 타입 사용으로 개선.
   * - saveDisasterData 메서드 추가
   * - 중복 데이터 저장 이슈 해결. but Cron 30초 주기에 따라 계속되는 DB 작업의 성능 이슈가 발생할 것으로 예상됨.
   * - fetch 주기를 10분으로 조정하고, 해당 이슈를 '배치 처리'로 해결해보려고함.
   *
   * TODO:
   * - 왜 DB에 저장해야하는지?
   *    : 주기적으로 DB에 저장하는 것으로 장기적인 데이터 보관 및 통계분석 작업이 가능해진다?
   * - 다른 대체 저장 수단은 없는지?
   *    : AWS S3를 백업 저장소처럼 사용?
   */

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleCron() {
    const disasterDataList = await this.fetchDisasterData();
    for (const disasterData of disasterDataList) {
      await this.sendDisasterInfoToStreams(disasterData);
    }
    await this.saveDisasterDataBatch(disasterDataList);
    this.lastFetchedTime = new Date();
  }

  // 1-1. 공공 데이터 API로부터 재난 문자 데이터를 가져오는 로직
  private async fetchDisasterData(): Promise<DisasterData[]> {
    const apiKey = this.configService.get<string>('DISASTER_API_KEY');
    try {
      const response = await axios.get(
        `http://apis.data.go.kr/1741000/DisasterMsg4/getDisasterMsg2List`,
        {
          params: {
            serviceKey: apiKey,
            fromTime: this.lastFetchedTime.toISOString(),
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

      let resultInRow = disasterDataJson['DisasterMsg2']['row'];
      if (!Array.isArray(resultInRow)) {
        resultInRow = [resultInRow];
      }

      // 데이터 필터링 - 날짜/키워드/지역명
      const currentDate = new Date();
      const currentDateString = currentDate
        .toISOString()
        .split('T')[0]
        .replace(/-/g, '/');

      const result: DisasterData[] = resultInRow
        .map((element) => ({
          locationName: element.location_name._text
            .split(',')
            .map((name) => name.trim()),
          message: element.msg._text,
          send_platform: element.send_platform._text,
          send_datetime: element.create_date._text,
        }))
        .filter((item) => {
          const keywords = ['실종', '배회', '찾습니다'];
          const messageDate = item.send_datetime.split(' ')[0];
          return (
            !keywords.some((keyword) => item.message.includes(keyword)) &&
            messageDate === currentDateString
          );
        });
      //console.log('result----------------------', result);

      return result;
    } catch (error) {
      console.log('axios 에러', error);
      return [];
    }
  }

  // 1-2. 재난 문자 데이터를 Redis Stream에서 관리
  async sendDisasterInfoToStreams(disasterData: DisasterData) {
    for (const area of disasterData.locationName) {
      const disasterStreamKey = RedisKeys.disasterStream(area);

      try {
        const streamExists =
          await this.redisService.client.exists(disasterStreamKey);
        if (streamExists) {
          // 존재한다면, 가장 최신의 데이터를 추가
          await this.addLatestDataToExistingStream(disasterData, area);
        } else {
          // 존재하지 않는다면, 자동으로 데이터를 추가
          await this.addDataToStream(disasterData, area);
        }
      } catch (error) {
        // NOKEY 에러가 발생할 경우, 더미 데이터를 추가한 다음부터 수신한 데이터 추가
        if (error.message.includes('NOKEY')) {
          await this.initializeStream(disasterStreamKey);
          await this.addDataToStream(disasterData, area);
        } else {
          throw error;
        }
      }
    }
  }

  async initializeStream(streamKey: string) {
    await this.redisService.client.xadd(streamKey, '*', 'init', '1');
  }

  async addDataToStream(disasterData: DisasterData, area: string) {
    const disasterStreamKey = RedisKeys.disasterStream(area);
    await this.redisService.client.xadd(
      disasterStreamKey,
      '*',
      'message',
      JSON.stringify(disasterData),
    );
    await this.updateLastTimestamp(
      disasterStreamKey,
      new Date(disasterData.send_datetime).toISOString(),
    );
  }

  async updateLastTimestamp(streamKey: string, timestamp: string) {
    const lastTimestampKey = RedisKeys.lastTimestamp(streamKey);
    await this.redisService.client.set(lastTimestampKey, timestamp);
  }

  async addLatestDataToExistingStream(
    disasterData: DisasterData,
    area: string,
  ) {
    const disasterStreamKey = RedisKeys.disasterStream(area);
    const lastTimestampKey = RedisKeys.lastTimestamp(disasterStreamKey);
    const lastTimestamp = await this.redisService.client.get(lastTimestampKey);

    if (
      !lastTimestamp ||
      new Date(disasterData.send_datetime) > new Date(lastTimestamp)
    ) {
      await this.redisService.client.xadd(
        disasterStreamKey,
        '*',
        'message',
        JSON.stringify(disasterData),
      );
      await this.redisService.client.set(
        lastTimestampKey,
        new Date(disasterData.send_datetime).toISOString(),
      );
    }
  }

  // 1-3. fetchDisasterData를 통해 가져온 데이터들을 백업하기 위해 DB에 저장
  private async saveDisasterDataBatch(disasterDataList: DisasterData[]) {
    for (const disasterData of disasterDataList) {
      const existingData = await this.disasterRepository.findOne({
        where: {
          message: disasterData.message,
          send_datetime: new Date(disasterData.send_datetime),
        },
      });

      if (!existingData) {
        const newDisasterData = this.disasterRepository.create(disasterData);
        try {
          await this.disasterRepository.save(newDisasterData);
        } catch (error) {
          console.error('DisasterData 저장 에러', error);
        }
      }
    }
  }
}
