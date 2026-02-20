import { Injectable } from '@nestjs/common';

@Injectable()
export class AppConfigService {
  get frontendUrl(): string {
    return process.env.FRONTEND_URL || 'http://localhost:5173';
  }

  get apiUrl(): string {
    return process.env.API_URL || 'http://localhost:3000';
  }

  get magicLinkExpiryMinutes(): number {
    return parseInt(process.env.MAGIC_LINK_EXPIRY_MINUTES || '15', 10);
  }

  get nodeEnv(): string {
    return process.env.NODE_ENV || 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get corsOrigin(): string {
    return process.env.CORS_ORIGIN || 'http://localhost:5173';
  }

  get whatsappToken(): string | undefined {
    return process.env.WHATSAPP_TOKEN;
  }

  get whatsappPhoneId(): string | undefined {
    return process.env.WHATSAPP_PHONE_ID;
  }

  get telegramBotToken(): string | undefined {
    return process.env.TELEGRAM_BOT_TOKEN;
  }

  get smtpHost(): string | undefined {
    return process.env.SMTP_HOST;
  }

  get smtpPort(): number {
    return parseInt(process.env.SMTP_PORT || '587', 10);
  }

  get smtpUser(): string | undefined {
    return process.env.SMTP_USER;
  }

  get smtpPass(): string | undefined {
    return process.env.SMTP_PASS;
  }

  getDatabaseUrl(): string | undefined {
    return process.env.DATABASE_URL;
  }

  getJwtSecret(): string {
    return process.env.JWT_SECRET || 'default-secret-change-in-production';
  }

  getJwtExpiresIn(): string {
    return process.env.JWT_EXPIRES_IN || '1d';
  }
}
