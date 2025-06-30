import admin from 'firebase-admin';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FirebaseService {
  private certFile: string;
  private app: admin.app.App;
  constructor(private configs: ConfigService) {
    this.certFile = this.configs.get('FIREBASE_SERVICE_ACCOUNT');
    this.app = admin.initializeApp({
      credential: admin.credential.cert(this.certFile),
    });
  }

  get instance() {
    return this.app;
  }
}
