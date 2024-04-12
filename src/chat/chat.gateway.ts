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

  private leaveAllRooms(socket: Socket): void {
    if (socket.rooms.size > 1) {
      // 현재 조인한 룸이 1개 초과인 경우 leave 처리
      socket.rooms.forEach((room) => {
        if (room !== socket.id) {
          socket.leave(room);
          console.log(`Client ${socket.id} left room ${room}`);
        }
      });
    }
  }

  handleConnection(client: Socket): void {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    const currentRoom = Object.keys(client.rooms).find(
      (room) => room !== client.id,
    );

    if (currentRoom) {
      client.leave(currentRoom); // 클라이언트가 속한 룸에서 나가기
      console.log(`Client ${client.id} left room ${currentRoom}`);
    }
    console.log(`Client disconnected: ${client.id}`);
  }
}
