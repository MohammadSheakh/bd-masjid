import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getApplicationInfo() {
    return {
      name: 'BD Masjid API',
      version: '1.0.0',
    };
  }

  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
