import { Redis } from 'ioredis';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService {
  private client: Redis;
  private redisHost: string;
  private redisPort: number;
  private redisIndex: number;

  constructor(private configs: ConfigService) {
    this.redisHost = this.configs.get('REDIS_HOST');
    this.redisPort = this.configs.get('REDIS_PORT');
    this.redisIndex = this.configs.get('REDIS_INDEX');

    this.client = new Redis({
      db: this.redisIndex,
      host: this.redisHost,
      port: this.redisPort,
    });
  }

  get instance() {
    return this.client;
  }
}
