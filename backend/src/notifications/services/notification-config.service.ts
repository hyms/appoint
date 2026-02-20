import { Injectable, Logger } from '@nestjs/common';

interface WhatsAppConfig {
  token: string;
  phoneId: string;
}

interface TelegramConfig {
  botToken: string;
}

interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
}

@Injectable()
export class NotificationConfigService {
  private readonly logger = new Logger(NotificationConfigService.name);

  getWhatsAppConfig(): WhatsAppConfig | null {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;

    if (!token || !phoneId) {
      return null;
    }
    return { token, phoneId };
  }

  getTelegramConfig(): TelegramConfig | null {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      return null;
    }
    return { botToken };
  }

  getEmailConfig(): EmailConfig | null {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      return null;
    }
    return { host, port: parseInt(port || '587', 10), user, pass };
  }

  isWhatsAppConfigured(): boolean {
    return this.getWhatsAppConfig() !== null;
  }

  isTelegramConfigured(): boolean {
    return this.getTelegramConfig() !== null;
  }

  isEmailConfigured(): boolean {
    return this.getEmailConfig() !== null;
  }
}
