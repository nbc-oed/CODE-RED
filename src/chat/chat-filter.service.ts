import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ChatFilterService {
  private bannedWords: string[];

  constructor() {
    this.loadBannedWords();
  }

  private loadBannedWords(): void {
    try {
      const filePath = path.resolve('src', 'chat', 'banned-words.txt'); // Txt 파일 경로 설정 src/chat/chat.html

      const data = fs.readFileSync(filePath, 'utf8');
      this.bannedWords = data.split('\n').map((word) => word.trim());
    } catch (error) {
      console.error('욕설 목록 파일 읽기 오류:', error);
      this.bannedWords = [];
    }
  }

  filterMessage(message: any): any {
    if (!this.bannedWords || this.bannedWords.length === 0) {
      return message;
    }

    let replaceMessage = message.data.toString();

    const profanity = this.bannedWords;
    function messageFilter(text) {
      const regex = new RegExp(profanity.join('|'), 'gi');
      return text.replace(regex, '**');
    }

    const filteredMessage = messageFilter(replaceMessage);

    return filteredMessage;
  }
}
