import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  getChatPage(@Res() res: Response): void {
    const filePath = path.resolve('src', 'chat', 'chat.html'); // html 파일 경로 설정 src/chat/chat.html
    res.sendFile(filePath);
  }
}
