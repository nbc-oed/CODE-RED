import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class DmRedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;

  constructor() {
    this.redisClient = new Redis({
      host: process.env.REDIS_DM_HOST,
      port: +process.env.REDIS_DM_PORT,
      password: process.env.REDIS_PASSWORD,
    });
  }

  onModuleInit() {
    this.redisClient.on('connect', () => {
      console.log('Connected to Redis within dm');
    });
  }

  onModuleDestroy() {
    this.redisClient.disconnect();
  }

  get client(): Redis {
    return this.redisClient;
  }
}
