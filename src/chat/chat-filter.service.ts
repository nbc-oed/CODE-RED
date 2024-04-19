import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ChatFilterService {
  private bannedWords: string[];

  constructor() {
    this.bannedWords = [];
    this.loadBannedWords();
  }

  private loadBannedWords(): void {
    try {
      const filePath = path.resolve('src', 'chat', 'banned-words.txt');

      const data = fs.readFileSync(filePath, 'utf8');
      this.bannedWords = data.split('\n').map((word) => word.trim());
    } catch (error) {
      console.error('욕설 목록 파일 읽기 오류:', error);
    }
  }

  filterMessage(message: {
    message: string;
    clientId: string;
    roomId: string;
  }): string {
    const { message: originalMessage, clientId } = message;
    const clientIdPrefix = clientId.substring(0, 4);

    let filteredMessage = originalMessage;

    if (this.bannedWords && this.bannedWords.length > 0) {
      const regex = new RegExp(this.bannedWords.join('|'), 'gi');
      filteredMessage = filteredMessage.replace(regex, '**');

      return `${clientIdPrefix} : ${filteredMessage}`;
    }
  }

  // // 클라이언트 ID가 없으면 랜덤한 4글자 ID 생성
  // const clientIdPrefix = clientId
  //   ? this.randomClientId.substring(0, 4)
  //   : this.generateRandomClientId();
  // generateRandomClientId(): string {
  //   const chars =
  //     'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  //   let randomClientId = '';
  //   for (let i = 0; i < 4; i++) {
  //     randomClientId += chars.charAt(Math.floor(Math.random() * chars.length));
  //   }
  //   return randomClientId;
  // }
}
