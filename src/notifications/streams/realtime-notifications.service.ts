import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { DisasterMessageParserService } from 'src/utils/disaster-message.parser.service';
import {
  DisasterMessage,
  RedisStreamResult,
} from 'src/common/types/disaster-message.interface';
import { FcmService } from '../messaging-services/firebase/fcm.service';
import { SmsService } from '../messaging-services/sms.service';
import { RedisKeys } from '../redis/redis.keys';
import { Interval } from '@nestjs/schedule';

@Injectable()
export class RealtimeNotificationService {
  private readonly logger = new Logger(RealtimeNotificationService.name);

  constructor(
    private redisService: RedisService,
    private parserService: DisasterMessageParserService,
    private fcmService: FcmService,
    private smsService: SmsService,
  ) {}

  /** 실시간 모니터링 - 가상 시나리오
   * <disasterServie에서>
   * 1. 30초 주기로 Cron 작업을 수행하여, 재난 데이터 스트림에 추가하고 DB에 백업을 한다.
   * 2. 데이터가 스트림에 추가됐다면, 해당 지역에 새로운 메세지가 발행되었는지 확인하기 위해 RealtimeNotificationService를 호출한다.
   *
   * <RealtimeNotificationService에서>
   * 1. XGROUP 명령어로 지역명을 기반으로 스트림과 컨슈머 그룹 존재여부 확인
   * 2. 모니터링 시작 - XREADGROUP 명령어로 재난 데이터 스트림 Scan
   * 3. 새 메세지 수신 성공시
   *  - 3-1. 이미 XACK 처리된 메세지인지 조회
   *  - 3-2. 메세지 파싱
   *  - 3-3. 알림 전송 처리
   *  - 3-4. 메세지 확인 처리
   *  - 3-5. XACK 중복 방지 및 만료 처리
   * 4. 수신할 메세지가 없다면 모니터링 종료
   * 5. 스트림 및 메세지 정리 로직
   *  - 5-1. 오래된 메세지 정리 로직
   *  - 5-2. 스트림 메세지 자동 정리
   *
   */

  async realTimeMonitoringStartAndProcessPushMessages(area: string) {
    const disasterStreamKey = RedisKeys.disasterStream(area);
    // 1. 스트림과 컨슈머 그룹 존재여부 확인
    await this.ensureStreamAndConsumerGroupExist(disasterStreamKey);

    // 2. 모니터링 시작
    this.logger.log('모니터링 시작, Starting message monitoring service...');

    try {
      this.logger.log(
        '스트림 메세지 읽기 시도 중, Attempting to read from stream...',
      );

      // 재난 데이터 스트림에서 메시지 읽기
      const messages = (await this.redisService.client.xreadgroup(
        'GROUP',
        'notificationGroup',
        'realtimeService',
        'BLOCK',
        15000, // 15초 동안 Pending 상태
        'STREAMS',
        disasterStreamKey,
        '>',
      )) as RedisStreamResult[];

      console.log('messages', messages);

      // 3. 새 메세지 수신 성공 -> 파싱 -> 알림 전송
      if (messages && messages.length > 0) {
        this.logger.log(
          `메세지 수신 성공, Received ${messages.length} messages from stream.`,
        );
        await this.NewStreamMessageParsingAndProcessing(messages);
      } else {
        // 4. 수신할 메세지 없다면 모니터링 종료
        this.logger.log(
          '수신할 메세지 없음 ---- 모니터링 종료: No messages received.',
        );
      }
    } catch (error) {
      this.logger.error('모니터링 및 메세지 수신 에러:', error);
    }
  }

  // 1. 지역명을 기반으로 스트림과 컨슈머 그룹 존재여부 확인
  private async ensureStreamAndConsumerGroupExist(disasterStreamKey: string) {
    try {
      await this.redisService.client.xgroup(
        'CREATE',
        disasterStreamKey,
        'notificationGroup',
        '$',
        'MKSTREAM',
      );
    } catch (error) {
      if (!error.message.includes('BUSYGROUP')) {
        this.logger.error('컨슈머 그룹 생성 실패:', error);
      }
    }
  }

  // 3. 새 메세지 수신 성공 -> 파싱 -> 알림 전송
  async NewStreamMessageParsingAndProcessing(messages: RedisStreamResult[]) {
    for (const [stream, streamMessages] of messages) {
      for (const [messageId, messageFields] of streamMessages) {
        // 3-1. 이미 XACK 처리된 메세지인지 조회
        const isProcessed = await this.isMessageProcessed(messageId);
        if (!isProcessed) {
          try {
            this.logger.log(
              `메시지 처리, Processing message ID ${messageId} from stream ${stream}.`,
            );

            // 3-2. Stream 메세지를 DisasterMessage 인터페이스에 맞게 파싱 작업
            const parsedMessage =
              this.parserService.parseDisasterMessage(messageFields);
            console.log('parsedMessage:', parsedMessage);

            // 3-3. 푸시 알림 전송 처리
            await this.processPushNotificationMessage(parsedMessage);

            // 3-4. 메세지 확인 처리
            await this.redisService.client.xack(
              stream,
              'notificationGroup',
              messageId,
            );

            // 3-5. XACK 중복 처리 방지
            await this.checkingMessageAsProcessed(messageId);

            this.logger.log(
              `메시지 확인 처리(XACK), Message ID ${messageId} acknowledged.`,
            );
          } catch (error) {
            this.logger.error(
              '모니터링 및 메세지 처리 에러 발생, Error in monitoring disaster streams',
              error,
              error.message,
            );
          }
        } else {
          this.logger.log(
            `메시지 중복 처리 건너뛰기, Skipping duplicated message ID ${messageId}.`,
          );
        }
      }
    }
  }

  // 3-1. 새 메세지 XACK 처리 이전에 해당 메세지 ID가 집합에 있는지 확인(존재하면 0, 아니면 1 반환)
  private async isMessageProcessed(messageId: string): Promise<boolean> {
    const processed = await this.redisService.client.sismember(
      'processedMessages',
      messageId,
    );
    return processed === 1;
  }

  // 3-3. 알림 전송 처리
  private async processPushNotificationMessage(message: DisasterMessage) {
    // 회원/비회원 ID 미식별시 Early Return
    if (!message.user_id && !message.client_id) {
      this.logger.error(
        `알림 전송 실패 - 회원/비회원 ID 없음: ${JSON.stringify(message)}`,
      );
      return;
    }

    // ID 유무에 따른 알림 전송 함수 호출
    const title = '긴급 재난 경보';
    try {
      const notificationPromises = [];

      if (message.user_id) {
        notificationPromises.push(
          this.fcmService.sendPushNotification(
            title,
            message.content,
            message.user_id,
          ),
        );
        this.logger.log(
          `회원 FCM 푸시 알림 전송 시작 : ${JSON.stringify(message)}`,
        );
        notificationPromises.push(
          this.smsService.sendSmsNotification(title, message.content),
        );
      }
      if (message.client_id) {
        notificationPromises.push(
          this.fcmService.sendPushNotification(
            title,
            message.content,
            undefined,
            message.client_id,
          ),
        );
        this.logger.log(
          `비회원 FCM 푸시 알림 전송 시작 : ${JSON.stringify(message)}`,
        );
      }

      await Promise.all(notificationPromises);
      this.logger.log(
        `알림 전송 성공... Notifications sent successfully for user ${message.user_id || message.client_id}.`,
      );
    } catch (error) {
      this.logger.error(
        `알림 전송 실패... Error sending notifications for user ${message.user_id || message.client_id}: ${error.message}`,
      );
    }
  }

  // 3-5. XACK 중복처리 방지하기 위해 Set 형태로 저장하고, 만료시간을 두어 자동 정리
  private async checkingMessageAsProcessed(messageId: string): Promise<void> {
    console.log('XACK 처리 확인 messageId', messageId);
    await this.redisService.client.sadd('processedMessages', messageId);
    await this.redisService.client.expire(messageId, 3600);
  }

  // 5-1. 오래된 메세지 정리 로직 : 실시간 모니터링으로 읽고 Set으로 관리되는 메세지를 24시간 마다 정리
  @Interval(86400000) // 24시간
  async cleanupOldProcessedMessages() {
    const allMessageIds =
      await this.redisService.client.smembers('processedMessages');
    for (const messageId of allMessageIds) {
      if (!(await this.redisService.client.exists(messageId))) {
        await this.redisService.client.srem('processedMessages', messageId);
      }
    }
  }

  // 5-2. 스트림 메세지 자동 정리
  @Interval(86400000) // 24시간
  async trimStreams() {
    const streams = [
      RedisKeys.disasterStream('area1'),
      RedisKeys.disasterStream('area2'),
    ];
    for (const stream of streams) {
      await this.redisService.client.xtrim(stream, 'MAXLEN', '~', 1000);
    }
  }
}
