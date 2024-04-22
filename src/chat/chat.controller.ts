import { Controller, Get, Render, Res } from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';
import { ApiTags } from '@nestjs/swagger';
import { Repository } from 'typeorm';
import { ChatService } from './chat.service';
import { LocationDto } from 'src/users/dto/user-location.dto';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  //@@@@@@@@@@@@@@@@@@
  constructor(
    private readonly locationService: LocationDto,
    private readonly chatService: ChatService,
  ) {}

  // @Get()
  // getChatPage(@Res() res: Response): void {
  //   const filePath = path.resolve('src', 'chat', 'chat.html'); // 파일 경로 설정 src/chat/chat.html

  //   res.sendFile(filePath);
  @Get('/live-chat')
  @Render('chats/live-chat')
  async liveChat() {}
}
