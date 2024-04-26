import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DisasterData } from 'src/common/entities/disaster-data.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import convert from 'xml-js';
import { RedisKeys } from 'src/notifications/redis/redis.keys';
import { RealtimeNotificationService } from '../realtime-notifications.service';

@Injectable()
export class DisasterService {
  private lastFetchedTime: Date;
  private readonly logger = new Logger(DisasterService.name);

  constructor(
    @InjectRepository(DisasterData)
    private disasterRepository: Repository<DisasterData>,
    private configService: ConfigService,
    private redisService: RedisService,
    private realtimeNotificationsService: RealtimeNotificationService,
  ) {
    this.lastFetchedTime = new Date();
  }

  // 스케줄러를 통한 재난 데이터 수집 자동화
  @Cron(CronExpression.EVERY_30_SECONDS)
  public async handleCron() {
    this.logger.log(`지역 재난 데이터 수집 시작`);
    const disasterDataList = await this.fetchDisasterData();
    for (const disasterData of disasterDataList) {
      await this.sendDisasterInfoToStreams(disasterData);
    }
    await this.saveDisasterDataBatch(disasterDataList);
    this.lastFetchedTime = new Date();
  }

  // 재난 문자 데이터 가져오기 및 필터링.
  async fetchDisasterData(): Promise<DisasterData[]> {
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

      let resultInRow = disasterDataJson['DisasterMsg2']['row'];
      if (!Array.isArray(resultInRow)) {
        resultInRow = [resultInRow];
      }

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
      this.logger.log('재난 문자 발송현황 데이터 수집 성공');
      return result;
    } catch (error) {
      this.logger.log('AXIOS 에러, Fetching Disaster Data', error);
      return [];
    }
  }

  // 지역에 따른 재난 문자 데이터를 Redis Stream에서 관리
  private async sendDisasterInfoToStreams(disasterData: DisasterData) {
    this.logger.log(`재난 데이터 스트림 가동...`);
    for (const area of disasterData.locationName) {
      const disasterStreamKey = RedisKeys.disasterStream(area);
      await this.initializeStreamIfNeeded(disasterStreamKey);
      await this.addLatestDataToExistingStream(disasterData, area);

      // 스트림에 데이터를 추가했다면, 해당 지역에 대한 모니터링 시작
      this.logger.log(`지역별 모니터링 시작...`);
      await this.realtimeNotificationsService.realTimeMonitoringStartAndProcessPushMessages(
        area,
      );
    }
  }

  // 스트림이 존재하지 않을 때에만, 자동으로 지역명 스트림 생성
  private async initializeStreamIfNeeded(disasterStreamKey: string) {
    const existingStream =
      await this.redisService.client.exists(disasterStreamKey);

    if (!existingStream) {
      await this.redisService.client.xgroup(
        'CREATE',
        disasterStreamKey,
        'notificationGroup',
        '$',
        'MKSTREAM',
      );
    }
  }

  // 재난 문자 스트림 최신화.
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

      this.logger.log(
        `${area} - 지역 재난 데이터 스트림 업데이트 완료,${new Date(lastTimestamp)}`,
      );
      await this.redisService.client.set(
        lastTimestampKey,
        new Date(disasterData.send_datetime).toISOString(),
      );
    }
  }

  // 재난 문자 데이터 DB 백업
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
        await this.disasterRepository.save(newDisasterData);
      }
    }
    this.logger.log(`DisasterData 백업 완료...`);
  }
}
