import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as OneSignal from '@onesignal/node-onesignal';

@Injectable()
export class OneSignalService {
  private readonly logger = new Logger(OneSignalService.name);
  private client: OneSignal.DefaultApi;
  private readonly appId: string;

  constructor(private configService: ConfigService) {
    const configuration = OneSignal.createConfiguration({
      restApiKey: this.configService.get<string>('ONESIGNAL_API_KEY'),
    });
    this.client = new OneSignal.DefaultApi(configuration);
    this.appId = this.configService.get<string>('ONESIGNAL_APP_ID');
  }

  async sendNotification(
    userIds: string[],
    message: string,
    data?: any,
  ) {
    if (!this.appId || this.appId === 'DISABLED') {
      this.logger.warn('OneSignal notifications are disabled');
      return;
    }

    const notification = new OneSignal.Notification();
    notification.app_id = this.appId;
    notification.contents = {
      en: message,
      es: message, // Default to same message for now
    };
    notification.include_external_user_ids = userIds;
    if (data) {
      notification.data = data;
    }

    try {
      const response = await this.client.createNotification(notification);
      this.logger.log(`OneSignal notification sent: ${response.id}`);
      return response;
    } catch (err) {
      this.logger.error('Failed to send OneSignal notification', err);
    }
  }
}
