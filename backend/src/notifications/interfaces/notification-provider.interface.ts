import { ProviderType } from '../dto/notification.dto';

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface INotificationProvider {
  readonly type: ProviderType;
  send(
    recipient: string,
    content: string,
    subject?: string,
    data?: Record<string, any>,
  ): Promise<SendResult>;
  isConfigured(): boolean;
}
