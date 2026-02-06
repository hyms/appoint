import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { NotificationProvider } from './services/notification-provider.service';
import { SendNotificationDto, SendBulkNotificationDto } from './dto/notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationProvider: NotificationProvider) {}

  @Post('send')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SECRETARY')
  async sendNotification(@Body() dto: SendNotificationDto) {
    return this.notificationProvider.sendNotification(dto);
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SECRETARY')
  async sendBulkNotification(@Body() dto: SendBulkNotificationDto) {
    return { message: 'Bulk notifications queued' };
  }

  @Get('logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SECRETARY')
  async getLogs(@Query('userId') userId?: string, @Query('status') status?: string) {
    const where: any = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const { PrismaService } = await import('../prisma/prisma.service');
    const prisma = new PrismaService();
    
    return prisma.notificationLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  @Post('test/whatsapp')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async testWhatsApp(@Body() body: { phone: string; message: string }) {
    return this.notificationProvider.sendWhatsApp(body.phone, body.message);
  }

  @Post('test/telegram')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async testTelegram(@Body() body: { chatId: string; message: string }) {
    return this.notificationProvider.sendTelegram(body.chatId, body.message);
  }

  @Post('test/email')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async testEmail(@Body() body: { to: string; subject: string; message: string }) {
    return this.notificationProvider.sendEmail(body.to, body.subject, body.message);
  }
}
