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
    return this.service.getOrCreateSettings();
  }

  @Patch()
  async updateSettings(@Body() dto: UpdateNotificationSettingsDto) {
    return this.service.updateSettings(dto);
  }

  @Post('test/telegram')
  async testTelegram() {
    return this.service.testTelegram();
  }

  @Post('test/whatsapp')
  async testWhatsApp() {
    return this.service.testWhatsapp();
  }

  @Post('test/sms')
  async testSms() {
    return this.service.testSms();
  }
}
