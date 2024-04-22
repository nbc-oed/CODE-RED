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

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: { message: string; clientId: string; roomId: string },
    @ConnectedSocket() socket: Socket,
  ): void {
    const { message, clientId, roomId } = data;

    const filteredMessage = this.chatFilterService.filterMessage({
      message,
      clientId,
      roomId,
    });

    const formattedMessage = `${filteredMessage}`;

    this.server.to(roomId).emit('message', formattedMessage);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() socket: Socket,
  ): void {
    const currentRoom = Object.keys(socket.rooms).find(
      (room) => room !== socket.id,
    );
    if (currentRoom) {
      socket.leave(currentRoom); // 이전 룸에서 나가기
      console.log(`Client ${socket.id} left room ${currentRoom}`);
    }

    socket.join(roomId);
    console.log(`Client ${socket.id} joined room ${roomId}`);
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() socket: Socket,
  ): void {
    socket.leave(roomId);
    console.log(`Client ${socket.id} left room ${roomId}`);
  }

  handleConnection(client: Socket): void {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    console.log(`Client disconnected: ${client.id}`);
  }
}
