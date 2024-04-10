import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: 'chat' })
export class ChatGateway {
  @WebSocketServer() server: Server;

  @SubscribeMessage('message')
  handleMessage(socket: Socket, data: any): void {
    this.server.emit('message', { message: data });
  }

  handleConnection(client: any): void {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: any): void {
    console.log(`Client disconnected: ${client.id}`);
  }
}
