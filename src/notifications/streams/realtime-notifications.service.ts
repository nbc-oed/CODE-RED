import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { DisasterMessageParserService } from 'src/utils/disaster-message.parser.service';
import {
  DisasterMessage,
  RedisStreamResult,
} from 'src/common/types/disaster-message.interface';
import { FcmService } from '../messing-services/fcm.service';
import { SmsService } from '../messing-services/sms.service';
import { RedisKeys } from '../redis/redis.keys';

@Injectable()
export class RealtimeNotificationService {
  private readonly logger = new Logger(RealtimeNotificationService.name);
  private running = true;

  constructor(
    private redisService: RedisService,
    private parserService: DisasterMessageParserService,
    private fcmService: FcmService,
    private smsService: SmsService,
  ) {}

  async monitorAndProcessMessages() {
    const disasterStreamKey = RedisKeys.disasterStream('area');
    const consumerGroup = 'notificationGroup';
    const consumerName = 'realtimeService';

    // 모니터링 시작 로그
    this.logger.log('모니터링 시작, Starting message monitoring service...');

    while (this.running) {
      try {
        // 재난 메시지 스트림에서 메시지 읽기
        const messages = (await this.redisService.client.xreadgroup(
          'GROUP',
          consumerGroup,
          consumerName,
          'BLOCK',
          5000, // 5초 동안 Pending 상태
          'STREAMS',
          disasterStreamKey,
          '>',
        )) as RedisStreamResult[];

        if (messages && messages.length > 0) {
          this.logger.log(
            `메세지 수신 성공, Received ${messages.length} messages from stream.`,
          );
          for (const [stream, streamMessages] of messages) {
            for (const [messageId, messageFields] of streamMessages) {
              this.logger.log(
                `메시지 처리, Processing message ID ${messageId} from stream ${stream}.`,
              );
              const parsedMessage =
                this.parserService.parseDisasterMessage(messageFields);
              await this.processMessage(parsedMessage);
              await this.redisService.client.xack(
                stream,
                consumerGroup,
                messageId,
              );
              this.logger.log(
                `메시지 확인 처리(XACK), Message ID ${messageId} acknowledged.`,
              );
            }
          }
        }
      } catch (error) {
        // 에러 발생 시 로그
        this.logger.error(
          '모니터링 및 메세지 처리 에러 발생, Error in monitoring disaster streams:',
          error,
        );
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    }
  }

  private async processMessage(message: DisasterMessage) {
    this.logger.log(
      `메세지 파싱 성공, Parsed message: ${JSON.stringify(message)}`,
    );
    await this.fcmService.sendPushNotification(
      message.user_id.toString(),
      message.content,
    );
    await this.smsService.sendSms(message.user_id.toString(), message.content);
  }
  onModuleDestroy() {
    this.running = false;
  }
}
