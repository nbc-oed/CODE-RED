import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

const user = {
  id: 1,
};

@WebSocketGateway({ namespace: '/dm' })
export class DmGateway {
  @WebSocketServer() server: Server;

  @SubscribeMessage('message')
  handleMessage(socket: Socket, data: any): void {
    // TODO: DB에 저장
    // TODO: 채팅목록 관련된 것
    this.server.in([...socket.rooms][1]).emit('message', {
      ...data,
      userName: '',
      profile_image: '',
    });
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(socket: Socket, data: any) {
    socket.leave([...socket.rooms][1]);
    socket.join(`${user.id}and${data.userId}`);
    // TODO: DB history emit
    socket.emit('joinRoom', `${user.id}and${data.userId}`);
  }

  handleDisconnect(socket: Socket): void {
    console.log(socket.id + ' is disconnected');
  }

  afterInit(): void {
    console.log('init');
  }
}
