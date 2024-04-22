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
}
