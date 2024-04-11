// import { Injectable } from '@nestjs/common';
// import * as admin from 'firebase-admin';

// @Injectable()
// export class FcmService {
//   constructor() {
//     admin.initializeApp({
//       credential: admin.credential.applicationDefault(),
//       // 다른 필요한 구성 요소
//     });
//   }

//   async sendPushNotification(token: string, message: string) {
//     const payload = {
//       notification: {
//         title: '재난 경보',
//         body: message,
//       },
//     };

//     try {
//       await admin.messaging().sendToDevice(token, payload);
//       console.log('Push notification sent successfully');
//     } catch (error) {
//       console.error('Error sending push notification:', error);
//     }
//   }
// }
