import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatFilterService } from './chat-filter.service';
import { MaydayModule } from 'src/mayday/mayday.module';
import { LocationDto } from 'src/users/dto/user-location.dto';
import { ChatService } from './chat.service';

@Module({
  imports: [MaydayModule],
  controllers: [ChatController],
  providers: [ChatGateway, ChatFilterService, ChatService, LocationDto],
})
export class ChatModule {}
