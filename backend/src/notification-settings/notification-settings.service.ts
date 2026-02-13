import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateNotificationSettingsDto } from './dto/notification-settings.dto';

@Injectable()
export class NotificationSettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    let settings = await this.prisma.notificationSettings.findFirst();

    if (!settings) {
      settings = await this.prisma.notificationSettings.create({
        data: {},
      });
    }

    return settings;
  }

  async updateSettings(dto: UpdateNotificationSettingsDto) {
    let settings = await this.prisma.notificationSettings.findFirst();

    if (!settings) {
      settings = await this.prisma.notificationSettings.create({
        data: {},
      });
    }

    return this.prisma.notificationSettings.update({
      where: { id: settings.id },
      data: dto,
    });
  }

  async testTelegram(botToken: string, chatId: string) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: '🔔 Test notification from Appointments 360',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.description || 'Failed to send message' };
      }

      return { success: true, message: 'Telegram test message sent successfully' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async testWhatsApp(phoneId: string, token: string) {
    try {
      return { success: false, error: 'WhatsApp API requires business verification. Please configure manually.' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async testTwilio(accountSid: string, authToken: string, fromNumber: string, toNumber: string) {
    try {
      const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: toNumber,
          From: fromNumber,
          Body: '🔔 Test notification from Appointments 360',
        }),
      });

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
