import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatFilterService } from './chat-filter.service';

@WebSocketGateway({ namespace: 'chat' })
export class ChatGateway {
  @WebSocketServer() server: Server;

  constructor(private readonly chatFilterService: ChatFilterService) {}

  // @SubscribeMessage('message')
  // handleMessage(
  //   @MessageBody() data: { message: string; clientId: string; }, // 메시지와 클라이언트 ID를 함께 받음
  //   @ConnectedSocket() socket: Socket,
  // ): void {
  //   const { message, clientId } = data;
  //   const filteredMessage = this.chatFilterService.filterMessage({
  //     message,
  //     clientId,
  //   });
  //   const formattedMessage = `${filteredMessage}`;

  //   this.server.emit('message', formattedMessage); // 클라이언트에게 포맷된 메시지 전송
  // }

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: { message: string; clientId: string; roomId: string }, // 메시지와 클라이언트 ID를 함께 받음
    @ConnectedSocket() socket: Socket,
  ): void {
    const { message, clientId, roomId } = data;
    const filteredMessage = this.chatFilterService.filterMessage({
      message,
      clientId,
      roomId,
    });
    const formattedMessage = `${filteredMessage}`;

    this.server.to(roomId).emit('message', formattedMessage); // 클라이언트에게 포맷된 메시지 전송
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() socket: Socket,
  ): void {
    socket.join(roomId);
    console.log(`Client ${socket.id} joined room ${roomId}`);
  }

  handleConnection(client: Socket): void {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    console.log(`Client disconnected: ${client.id}`);
  }
}
