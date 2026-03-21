import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OneSignalService {
  private readonly logger = new Logger(OneSignalService.name);
  // private client: any;
  private readonly appId: string;

  constructor(private configService: ConfigService) {
    this.appId = this.configService.get<string>('ONESIGNAL_APP_ID') || 'DISABLED';
    this.logger.warn('OneSignal Service initialized (Stub)');
  }

  async sendNotification(
    userIds: string[],
    message: string,
    data?: any,
  ) {
    if (!this.appId || this.appId === 'DISABLED') {
      this.logger.warn('OneSignal notifications are disabled (Stub)');
      return;
    }

    this.logger.log(`OneSignal notification sent: ${message} (Stub)`);
  }
}
