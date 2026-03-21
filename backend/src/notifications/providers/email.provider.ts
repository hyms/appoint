import { Injectable, Logger } from '@nestjs/common';
import { ProviderType } from '../dto/notification.dto';
import {
  INotificationProvider,
  SendResult,
} from '../interfaces/notification-provider.interface';
import { NotificationConfigService } from '../services/notification-config.service';

@Injectable()
export class EmailProvider implements INotificationProvider {
  readonly type = ProviderType.EMAIL;
  private readonly logger = new Logger(EmailProvider.name);

  constructor(private configService: NotificationConfigService) {}

  isConfigured(): boolean {
    return this.configService.isEmailConfigured();
  }

  async send(
    recipient: string,
    content: string,
    subject?: string,
  ): Promise<SendResult> {
    const config = this.configService.getEmailConfig();

    if (!config) {
      this.logger.warn('Email credentials not configured. Simulating send.');
      return this.simulateSend(recipient, subject, content);
    }

    console.log(`[EMAIL] To: ${recipient}, Subject: ${subject}`);
    console.log(`[EMAIL] Body: ${content}`);

    return { success: true, messageId: `email-${Date.now()}` };
  }

  private simulateSend(
    recipient: string,
    subject?: string,
    body?: string,
  ): SendResult {
    this.logger.log(
      `[Email] Simulated send to ${recipient}: ${subject || 'No subject'}`,
    );
    return { success: true, messageId: `email-simulated-${Date.now()}` };
  }
}
