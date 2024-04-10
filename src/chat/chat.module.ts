import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatFilterService } from './chat-filter.service';

@Module({
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, ChatFilterService],
})
export class ChatModule {}
