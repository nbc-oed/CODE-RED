import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatFilterService } from './chat-filter.service';

@WebSocketGateway({ namespace: 'chat' })
export class ChatGateway {
  @WebSocketServer() server: Server;

  /** */
  constructor(private readonly chatFilterService: ChatFilterService) {}
  /** */

  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: string, client: Socket): void {
    const filteredMessage = this.chatFilterService.filterMessage(data);
    this.server.emit('message', { message: filteredMessage });
  }

  handleConnection(client: any): void {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: any): void {
    console.log(`Client disconnected: ${client.id}`);
  }
}
