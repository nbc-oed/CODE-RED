import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DirectMessages } from '../common/entities/direct-messages.entity';
import { RedisService } from 'src/notifications/redis/redis.service';
import { FcmService } from 'src/notifications/messaging-services/firebase/fcm.service';

@WebSocketGateway({ namespace: '/dm' })
export class DmGateway {
  @WebSocketServer() server: Server;

  constructor(
    private redisService: RedisService,
    private fcmService: FcmService,
  ) {}

  @SubscribeMessage('message')
  async handleMessage(socket: Socket, data: IncomingMsgDto): Promise<void> {
    const newMsg: Omit<DirectMessages, 'id'> = {
      user_id: data.userId,
      message: data.message,
      room_name: data.roomName,
      created_at: data.createdAt,
    };
    const targetUserId = +data.roomName
      .split('_')
      .filter((id) => +id !== +data.userId)[0];

    this.redisService.client.rpush(
      `dm:${data.roomName}`,
      JSON.stringify(newMsg),
    );

    this.fcmService.sendPushNotification(
      data.nickname,
      newMsg.message,
      targetUserId,
    );

    this.server
      .in([`${data.userId}_list`, `${targetUserId}_list`])
      .emit('listEvent', newMsg);

    this.server.in(data.roomName).emit('message', newMsg);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(socket: Socket, roomName: string): Promise<void> {
    socket.join(roomName);
  }

  handleConnection(socket: Socket): void {
    console.log(socket.id + 'is connected');
  }

  handleDisconnect(socket: Socket): void {
    console.log(socket.id + ' is disconnected');
  }

  afterInit(): void {
    console.log('/dm socket init');
  }
}

interface IncomingMsgDto {
  userId: number;
  message: string;
  nickname: string;
  roomName: string;
  createdAt: Date;
}
