import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateNotificationSettingsDto } from './dto/notification-settings.dto';
import { AppConfigService } from '../config/config.service';

@Injectable()
export class NotificationSettingsService {
  constructor(
    private prisma: PrismaService,
    private configService: AppConfigService,
  ) {}

  async getOrCreateSettings() {
    let settings = await this.prisma.notificationSettings.findFirst();

    if (!settings) {
      settings = await this.prisma.notificationSettings.create({
        data: {},
      });
    }

    return settings;
  }

  async updateSettings(dto: UpdateNotificationSettingsDto) {
    const settings = await this.getOrCreateSettings();

    return this.prisma.notificationSettings.update({
      where: { id: settings.id },
      data: dto,
    });
  }

  async testTelegram() {
    const token = this.configService.telegramBotToken;
    const chatId = this.configService.telegramTestChatId;

    if (!token || !chatId) {
      return { success: false, error: 'Telegram config missing in .env' };
    }

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: 'Test notification from Appointments 360',
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.description || 'Failed to send message',
        };
      }

      return {
        success: true,
        message: 'Telegram test message sent successfully',
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async testWhatsapp() {
    const token = this.configService.whatsappToken;
    const phoneId = this.configService.whatsappPhoneId;

    if (!token || !phoneId) {
      return { success: false, error: 'WhatsApp config missing in .env' };
    }

    return {
      success: false,
      error:
        'WhatsApp API requires business verification. Please configure manually.',
    };
  }

  async testSms() {
    const accountSid = this.configService.twilioAccountSid;
    const authToken = this.configService.twilioAuthToken;
    const fromNumber = this.configService.twilioFromNumber;
    const toNumber = this.configService.twilioTestToNumber;

    if (!accountSid || !authToken || !fromNumber || !toNumber) {
      return { success: false, error: 'Twilio config missing in .env' };
    }

    try {
      const credentials = Buffer.from(`${accountSid}:${authToken}`).toString(
        'base64',
      );
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: toNumber,
            From: fromNumber,
            Body: 'Test notification from Appointments 360',
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message || 'Failed to send SMS' };
      }

      return { success: true, message: 'SMS test message sent successfully' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
