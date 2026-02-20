import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  SendNotificationDto,
  NotificationType,
  ProviderType,
} from '../dto/notification.dto';
import { NotificationProviderRegistry } from './notification-provider.registry';
import { NotificationConfigService } from './notification-config.service';

@Injectable()
export class NotificationProviderService {
  private readonly logger = new Logger(NotificationProviderService.name);

  constructor(
    private prisma: PrismaService,
    private registry: NotificationProviderRegistry,
    private configService: NotificationConfigService,
  ) {}

  async sendNotification(dto: SendNotificationDto) {
    const notification = await this.prisma.notificationLog.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        recipient: dto.recipient,
        subject: dto.subject,
        content: dto.content,
        status: 'PENDING',
      },
    });

    try {
      const providerType = dto.provider || ProviderType.EMAIL;
      const provider = this.registry.get(providerType);

      if (!provider) {
        throw new BadRequestException(`Provider ${providerType} not available`);
      }

      if (!provider.isConfigured()) {
        this.logger.warn(
          `Provider ${providerType} not configured, using fallback`,
        );
        const fallbackProvider = this.registry.getDefault();
        if (!fallbackProvider) {
          throw new BadRequestException('No notification provider available');
        }
        const fallbackResult = await fallbackProvider.send(
          dto.recipient,
          dto.content,
          dto.subject,
        );
        return this.updateNotificationStatus(notification.id, fallbackResult);
      }

      const result = await provider.send(
        dto.recipient,
        dto.content,
        dto.subject,
      );

      return this.updateNotificationStatus(notification.id, result);
    } catch (error) {
      this.logger.error(
        `Failed to send notification ${notification.id}:`,
        error,
      );

      return this.prisma.notificationLog.update({
        where: { id: notification.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
        },
      });
    }
  }

  private async updateNotificationStatus(
    notificationId: string,
    result: { success: boolean; messageId?: string; error?: string },
  ) {
    return this.prisma.notificationLog.update({
      where: { id: notificationId },
      data: {
        status: result.success ? 'SENT' : 'FAILED',
        sentAt: result.success ? new Date() : null,
        errorMessage: result.success ? null : result.error,
      },
    });
  }

  async sendAppointmentReminder(appointment: any) {
    const patient = appointment.patient;
    const message = this.formatReminderMessage(appointment);

    return this.sendNotification({
      userId: patient.id,
      type: NotificationType.APPOINTMENT_REMINDER,
      recipient: patient.phone || patient.email,
      subject: 'Appointment Reminder',
      content: message,
      provider: patient.phone ? ProviderType.WHATSAPP : ProviderType.EMAIL,
    });
  }

  private formatReminderMessage(appointment: any): string {
    const date = new Date(appointment.date).toLocaleDateString();
    const time = new Date(appointment.startTime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    return `
Appointment Reminder

Dear ${appointment.patient?.profile?.firstName || 'Patient'},

This is a reminder for your upcoming appointment:

📅 Date: ${date}
🕐 Time: ${time}
👨‍⚕️ Doctor: Dr. ${appointment.professional?.profile?.lastName || 'Professional'}
${appointment.location ? `📍 Location: ${appointment.location.name}` : ''}

Please arrive 10 minutes early.

If you need to cancel or reschedule, please contact us as soon as possible.

Thank you!
Appointments 360
    `.trim();
  }

  async sendConfirmation(appointment: any) {
    const message = this.formatConfirmationMessage(appointment);

    return this.sendNotification({
      userId: appointment.patientId,
      type: NotificationType.APPOINTMENT_CONFIRMATION,
      recipient: appointment.patient?.email,
      subject: 'Appointment Confirmed',
      content: message,
      provider: ProviderType.EMAIL,
    });
  }

  private formatConfirmationMessage(appointment: any): string {
    const date = new Date(appointment.date).toLocaleDateString();
    const time = new Date(appointment.startTime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    return `
Appointment Confirmed

Dear ${appointment.patient?.profile?.firstName || 'Patient'},

Your appointment has been confirmed:

📅 Date: ${date}
🕐 Time: ${time}
👨‍⚕️ Doctor: Dr. ${appointment.professional?.profile?.lastName || 'Professional'}

We look forward to seeing you!

Appointments 360
    `.trim();
  }

  async sendCancellationNotice(appointment: any, reason: string) {
    const message = this.formatCancellationMessage(appointment, reason);

    return this.sendNotification({
      userId: appointment.patientId,
      type: NotificationType.APPOINTMENT_CANCELLATION,
      recipient: appointment.patient?.email,
      subject: 'Appointment Cancelled',
      content: message,
      provider: ProviderType.EMAIL,
    });
  }

  private formatCancellationMessage(appointment: any, reason: string): string {
    const date = new Date(appointment.date).toLocaleDateString();

    return `
Appointment Cancelled

Dear ${appointment.patient?.profile?.firstName || 'Patient'},

Your appointment scheduled for ${date} has been cancelled.

Reason: ${reason}

If you have any questions, please contact us.

Appointments 360
    `.trim();
  }

  async sendEmergencyNotification(message: string, affectedPatients: any[]) {
    const results = [];

    for (const patient of affectedPatients) {
      const result = await this.sendNotification({
        userId: patient.id,
        type: NotificationType.EMERGENCY_NOTIFICATION,
        recipient: patient.email,
        subject: 'Urgent Notice - Appointment Affected',
        content: message,
        provider: ProviderType.EMAIL,
      });
      results.push(result);
    }

    return results;
  }
}
