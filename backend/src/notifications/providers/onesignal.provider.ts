import { Injectable, Logger } from '@nestjs/common';
import { ProviderType } from '../dto/notification.dto';
import {
  INotificationProvider,
  SendResult,
} from '../interfaces/notification-provider.interface';
import { OneSignalService } from '../onesignal.service';

@Injectable()
export class OneSignalProvider implements INotificationProvider {
  readonly type = ProviderType.ONESIGNAL;
  private readonly logger = new Logger(OneSignalProvider.name);

  constructor(private oneSignalService: OneSignalService) {}

  isConfigured(): boolean {
    return this.oneSignalService.isConfigured();
  }

  async send(
    recipient: string, // This will be the oneSignalPlayerId
    content: string,
    subject?: string,
    data?: Record<string, any>,
  ): Promise<SendResult> {
    if (!this.isConfigured()) {
      this.logger.warn('OneSignal is not configured. Simulating send.');
      return { success: true, messageId: `onesignal-simulated-${Date.now()}` };
    }

    if (!recipient) {
      this.logger.warn(
        'OneSignal recipient (playerId) is missing. Skipping send.',
      );
      return { success: false, error: 'PlayerId missing' };
    }

    const result = await this.oneSignalService.sendNotification(
      {
        userId: data?.userId || 'unknown',
        heading: subject || 'Notification',
        content,
        data: data ?? {},
      },
      recipient,
    );

    return result;
  }
}
