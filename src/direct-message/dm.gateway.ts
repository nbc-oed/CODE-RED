import { InjectRepository } from '@nestjs/typeorm';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DirectMessages } from '../common/entities/direct-messages.entity';
import { Repository } from 'typeorm';

@WebSocketGateway({ namespace: '/dm' })
export class DmGateway {
  @WebSocketServer() server: Server;

  constructor(
    @InjectRepository(DirectMessages)
    private readonly dmRepo: Repository<DirectMessages>,
  ) {}

  @SubscribeMessage('message')
  handleMessage(socket: Socket, data: DirectMessages): void {
    this.dmRepo.save({ ...data });

    this.server.in(data.roomName).emit('message', data);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(socket: Socket, roomName: string): Promise<void> {
    socket.leave([...socket.rooms][1]);
    socket.join(roomName);

    const history = await this.dmRepo.findBy({ roomName });
    socket.emit('joinRoom', { roomName, history });
  }

  handleDisconnect(socket: Socket): void {
    console.log(socket.id + ' is disconnected');
  }

  afterInit(): void {
    console.log('init');
  }
}
