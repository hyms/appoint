import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface OneSignalNotification {
  userId: string;
  heading: string;
  content: string;
  data?: Record<string, any>;
}

interface OneSignalResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class OneSignalService {
  private readonly logger = new Logger(OneSignalService.name);
  private readonly appId: string | undefined;
  private readonly apiKey: string | undefined;

  constructor(private configService: ConfigService) {
    this.appId = this.configService.get<string>('ONESIGNAL_APP_ID');
    this.apiKey = this.configService.get<string>('ONESIGNAL_API_KEY');
  }

  isConfigured(): boolean {
    return !!this.appId && !!this.apiKey && this.appId !== 'DISABLED';
  }

  async sendNotification(
    notification: OneSignalNotification,
    playerId: string,
  ): Promise<OneSignalResult> {
    if (!this.isConfigured()) {
      this.logger.warn('OneSignal not configured. Simulating send.');
      return this.simulateSend(notification, playerId);
    }

    try {
      const response = await fetch(
        'https://onesignal.com/api/v1/notifications',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${this.apiKey}`,
          },
          body: JSON.stringify({
            app_id: this.appId,
            include_player_ids: [playerId],
            headings: { en: notification.heading },
            contents: { en: notification.content },
            data: notification.data,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OneSignal API error: ${response.status} - ${error}`);
      }

      const result = await response.json();
      this.logger.log(
        `OneSignal notification sent to ${playerId}: ${result.id}`,
      );
      return { success: true, messageId: result.id };
    } catch (error) {
      this.logger.error(`OneSignal send failed for ${playerId}:`, error);
      return { success: false, error: error.message };
    }
  }

  async sendToMultiple(
    notification: OneSignalNotification,
    playerIds: string[],
  ): Promise<OneSignalResult> {
    if (!this.isConfigured()) {
      this.logger.warn('OneSignal not configured. Simulating bulk send.');
      return this.simulateSend(notification, playerIds[0]);
    }

    try {
      const response = await fetch(
        'https://onesignal.com/api/v1/notifications',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${this.apiKey}`,
          },
          body: JSON.stringify({
            app_id: this.appId,
            include_player_ids: playerIds,
            headings: { en: notification.heading },
            contents: { en: notification.content },
            data: notification.data,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OneSignal API error: ${response.status} - ${error}`);
      }

      const result = await response.json();
      this.logger.log(
        `OneSignal bulk notification sent to ${playerIds.length} players: ${result.id}`,
      );
      return { success: true, messageId: result.id };
    } catch (error) {
      this.logger.error(`OneSignal bulk send failed:`, error);
      return { success: false, error: error.message };
    }
  }

  private simulateSend(
    notification: OneSignalNotification,
    playerId: string,
  ): OneSignalResult {
    this.logger.log(
      `[OneSignal] Simulated send to ${playerId}: ${notification.heading}`,
    );
    this.logger.debug(`[OneSignal] Content: ${notification.content}`);
    return { success: true, messageId: `onesignal-simulated-${Date.now()}` };
  }
}
