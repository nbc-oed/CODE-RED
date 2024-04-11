// import { Injectable } from '@nestjs/common';
// import { RedisService } from './redis/redis.service';
// import { EmailService } from './email.service';
// import { SmsService } from './sms.service';

// @Injectable()
// export class RealtimeNotificationService {
//   constructor(
//     private redisService: RedisService,
//     private emailService: EmailService,
//     private smsService: SmsService,
//     private fcmService: FcmService,
//   ) {}

//   async monitorDisasterStreams() {
//     // 컨슈머 그룹 및 스트림 설정
//     const disasterStreamKey = 'disasterStream';
//     const userLocationStreamKey = 'userLocationStream';
//     const consumerGroup = 'notificationGroup';
//     const consumerName = 'consumerName';

//     while (true) {
//       try {
//         // 재난 문자 데이터 스트림에서 메시지 읽기
//         const disasterMessages = await this.redisService.client.xreadgroup(
//           'GROUP',
//           consumerGroup,
//           consumerName,
//           'BLOCK',
//           0,
//           'STREAMS',
//           disasterStreamKey,
//           '>',
//         );

//         // 사용자 위치 정보 스트림에서 메시지 읽기
//         const userLocationMessages = await this.redisService.client.xreadgroup(
//           'GROUP',
//           consumerGroup,
//           consumerName,
//           'BLOCK',
//           0,
//           'STREAMS',
//           userLocationStreamKey,
//           '>',
//         );

//         // 재난 문자 데이터 처리
//         if (disasterMessages) {
//           for (const [stream, streamMessages] of disasterMessages) {
//             for (const [messageId, messageData] of streamMessages) {
//               await this.processDisasterMessage(messageData);
//               await this.redisService.client.xack(
//                 stream,
//                 consumerGroup,
//                 messageId,
//               );
//             }
//           }
//         }

//         // 사용자 위치 데이터 처리
//         if (userLocationMessages) {
//           for (const [stream, streamMessages] of userLocationMessages) {
//             for (const [messageId, messageData] of streamMessages) {
//               await this.processUserLocationMessage(messageData);
//               await this.redisService.client.xack(
//                 stream,
//                 consumerGroup,
//                 messageId,
//               );
//             }
//           }
//         }
//       } catch (error) {
//         console.error('Error in monitoring disaster streams:', error);
//       }
//     }
//   }

//   private async processDisasterMessage(messageData: any) {
//     const userId = messageData.userId;
//     const disasterData = JSON.parse(messageData.disasterData);

//     // 사용자 알림 수신 동의 여부 확인하는 로직
//     // 알림 수단에 대한 사용자 설정 확인하는 로직
//     const userPreferences = await this.userService.getUserPreferences(userId);
//     if (!userPreferences) {
//       console.warn(`User preferences not found for user ${userId}`);
//       return;
//     }

//     // 실시간 알림 전송
//     if (userPreferences.emailEnabled) {
//       await this.emailService.sendEmail(userId, disasterData.message);
//     }
//     if (userPreferences.smsEnabled) {
//       await this.smsService.sendSms(userId, disasterData.message);
//     }
//     if (userPreferences.pushNotificationsEnabled) {
//       // 예시 사용자 토큰 및 메시지 데이터
//       const userToken = 'example_user_token';
//       const disasterMessage = 'This is a disaster alert message';

//       // FCM을 사용하여 푸시 알림 전송
//       await this.fcmService.sendPushNotification(userToken, disasterMessage);
//     }
//   }
// }
