import { Controller, Get, Patch, Body, UseGuards, Post } from '@nestjs/common';
import { NotificationSettingsService } from './notification-settings.service';
import { UpdateNotificationSettingsDto } from './dto/notification-settings.dto';
import { JwtAuthGuard } from '../auth/guards/roles.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('notification-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class NotificationSettingsController {
  constructor(private readonly service: NotificationSettingsService) {}

  @Get()
  async getSettings() {
    return this.service.getSettings();
  }

  @Patch()
  async updateSettings(@Body() dto: UpdateNotificationSettingsDto) {
    return this.service.updateSettings(dto);
  }

  @Post('test/telegram')
  async testTelegram(@Body() body: { botToken: string; chatId: string }) {
    return this.service.testTelegram(body.botToken, body.chatId);
  }

  @Post('test/whatsapp')
  async testWhatsApp(@Body() body: { phoneId: string; token: string }) {
    return this.service.testWhatsApp(body.phoneId, body.token);
  }

  @Post('test/sms')
  async testSms(
    @Body()
    body: {
      accountSid: string;
      authToken: string;
      fromNumber: string;
      toNumber: string;
    },
  ) {
    return this.service.testTwilio(
      body.accountSid,
      body.authToken,
      body.fromNumber,
      body.toNumber,
    );
  }
}
