import { Injectable, Logger } from '@nestjs/common';
import { ProviderType } from '../dto/notification.dto';
import {
  INotificationProvider,
  SendResult,
} from '../interfaces/notification-provider.interface';
import { NotificationConfigService } from '../services/notification-config.service';

@Injectable()
export class TelegramProvider implements INotificationProvider {
  readonly type = ProviderType.TELEGRAM;
  private readonly logger = new Logger(TelegramProvider.name);

  constructor(private configService: NotificationConfigService) {}

  isConfigured(): boolean {
    return this.configService.isTelegramConfigured();
  }

  async send(recipient: string, content: string): Promise<SendResult> {
    const config = this.configService.getTelegramConfig();

    if (!config) {
      this.logger.warn('Telegram credentials not configured. Simulating send.');
      return this.simulateSend(recipient, content);
    }

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${config.botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: recipient,
            text: content,
            parse_mode: 'HTML',
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, messageId: data.result?.message_id?.toString() };
    } catch (error) {
      this.logger.error('Telegram send failed:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  private simulateSend(recipient: string, message: string): SendResult {
    this.logger.log(
      `[Telegram] Simulated send to ${recipient}: ${message.substring(0, 50)}...`,
    );
    return { success: true, messageId: `telegram-simulated-${Date.now()}` };
  }
}
