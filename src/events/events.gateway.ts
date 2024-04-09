import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class EventsGateway {
  @WebSocketServer() server: Server;

  @SubscribeMessage('message')
  handleMessage(socket: Socket, data: any): string {
    return 'Hello world!';
  }

  handleConnection(socket: Socket): void {
    console.log(socket.id + ' is connected');
  }

  handleDisconnect(socket: Socket): void {
    console.log(socket.id + ' is disconnected');
  }

  afterInit(): void {
    console.log('init');
  }
}
