import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { NotificationProviderService } from './services/notification-provider.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  SendNotificationDto,
  SendBulkNotificationDto,
} from './dto/notification.dto';
import { JwtAuthGuard } from '../auth/guards/roles.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { WhatsAppProvider } from './providers/whatsapp.provider';
import { TelegramProvider } from './providers/telegram.provider';
import { EmailProvider } from './providers/email.provider';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationService: NotificationProviderService,
    private readonly prisma: PrismaService,
    private readonly whatsappProvider: WhatsAppProvider,
    private readonly telegramProvider: TelegramProvider,
    private readonly emailProvider: EmailProvider,
  ) {}

  @Post('send')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SECRETARY')
  async sendNotification(@Body() dto: SendNotificationDto) {
    return this.notificationService.sendNotification(dto);
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
  @Roles('ADMIN')
  async testWhatsApp(@Body() body: { phone: string; message: string }) {
    return this.whatsappProvider.send(body.phone, body.message);
  }

  @Post('test/telegram')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async testTelegram(@Body() body: { chatId: string; message: string }) {
    return this.telegramProvider.send(body.chatId, body.message);
  }

  @Post('test/email')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async testEmail(
    @Body() body: { to: string; subject: string; message: string },
  ) {
    return this.emailProvider.send(body.to, body.message, body.subject);
  }
}
