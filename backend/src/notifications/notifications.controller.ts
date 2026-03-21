import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { NotificationProviderService } from './services/notification-provider.service';
import { NotificationProviderRegistry } from './services/notification-provider.registry';
import { PrismaService } from '../prisma/prisma.service';
import {
  SendNotificationDto,
  SendBulkNotificationDto,
} from './dto/notification.dto';
import { JwtAuthGuard } from '../auth/guards/roles.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationService: NotificationProviderService,
    private readonly prisma: PrismaService,
    private readonly registry: NotificationProviderRegistry,
  ) {}

  @Post('send')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
  async sendNotification(@Body() dto: SendNotificationDto) {
    return this.notificationService.sendNotification(dto);
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
  async sendBulkNotification(@Body() dto: SendBulkNotificationDto) {
    return { message: 'Bulk notifications queued' };
  }

  @Get('logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
  async getLogs(
    @Query('userId') userId?: string,
    @Query('status') status?: string,
  ) {
    const where: any = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;

    return this.prisma.notificationLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  @Post('test/whatsapp')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async testWhatsApp(@Body() body: { phone: string; message: string }) {
    const provider = this.registry.get('WHATSAPP' as any);
    if (!provider) {
      return { success: false, error: 'WhatsApp provider not configured' };
    }
    return provider.send(body.phone, body.message);
  }

  @Post('test/telegram')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async testTelegram(@Body() body: { chatId: string; message: string }) {
    const provider = this.registry.get('TELEGRAM' as any);
    if (!provider) {
      return { success: false, error: 'Telegram provider not configured' };
    }
    return provider.send(body.chatId, body.message);
  }

  @Post('test/email')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async testEmail(
    @Body() body: { to: string; subject: string; message: string },
  ) {
    const provider = this.registry.get('EMAIL' as any);
    if (!provider) {
      return { success: false, error: 'Email provider not configured' };
    }
    return provider.send(body.to, body.message, body.subject);
  }
}
