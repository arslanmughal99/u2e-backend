import { Etcd3 } from 'etcd3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EtcdService {
  private client: Etcd3;
  constructor(private configs: ConfigService) {
    const hosts: string[] = this.configs.get<string>('ETCD_HOSTS').split(',');
    this.client = new Etcd3({ hosts });
  }

  get instance() {
    return this.client;
  }
}
