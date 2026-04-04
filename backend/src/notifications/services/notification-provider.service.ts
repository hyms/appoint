import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import { SendNotificationDto, ProviderType } from '../dto/notification.dto';
import { NotificationProviderRegistry } from './notification-provider.registry';

@Injectable()
export class NotificationProviderService {
  private readonly logger = new Logger(NotificationProviderService.name);

  constructor(
    private prisma: PrismaService,
    private registry: NotificationProviderRegistry,
  ) {}


  async sendNotification(dto: SendNotificationDto) {
    const notification = await this.prisma.notificationLog.create({
      data: {
        user: { connect: { id: dto.userId } },
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
          `Provider ${providerType} not configured, using default/email fallback`,
        );
        const defaultProvider = this.registry.getDefault();
        if (!defaultProvider) {
          throw new BadRequestException('No notification provider available');
        }
        const fallbackResult = await defaultProvider.send(
          dto.recipient,
          dto.content,
          dto.subject,
          dto.data,
        );
        return this.updateNotificationStatus(notification.id, fallbackResult);
      }

      const result = await provider.send(
        dto.recipient,
        dto.content,
        dto.subject,
        dto.data,
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
          errorMessage: (error as Error).message,
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

  async sendAppointmentReminder(appointment: any) {
    const message = this.formatReminderMessage(appointment);

    return this.sendNotification({
      userId: appointment.patientId,
      type: NotificationType.APPOINTMENT_REMINDER,
      recipient:
        appointment.patient?.oneSignalPlayerId ||
        appointment.patient?.email ||
        appointment.patient?.phone,
      subject: 'Appointment Reminder',
      content: message,
      provider: appointment.patient?.oneSignalPlayerId
        ? ProviderType.ONESIGNAL
        : appointment.patient?.phone
          ? ProviderType.WHATSAPP
          : ProviderType.EMAIL,
      data: {
        appointmentId: appointment.id,
        type: NotificationType.APPOINTMENT_REMINDER,
      },
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

  async sendConfirmation(appointment: any) {
    const message = this.formatConfirmationMessage(appointment);

    return this.sendNotification({
      userId: appointment.patientId,
      type: NotificationType.APPOINTMENT_CONFIRMATION,
      recipient:
        appointment.patient?.oneSignalPlayerId ||
        appointment.patient?.email ||
        appointment.patient?.phone,
      subject: 'Appointment Confirmed',
      content: message,
      provider: appointment.patient?.oneSignalPlayerId
        ? ProviderType.ONESIGNAL
        : appointment.patient?.phone
          ? ProviderType.WHATSAPP
          : ProviderType.EMAIL,
      data: {
        appointmentId: appointment.id,
        type: NotificationType.APPOINTMENT_CONFIRMATION,
      },
    });
  }

  private formatCancellationMessage(appointment: any, reason: string): string {
    const date = new Date(appointment.date).toLocaleDateString();

    return `
Appointment Cancelled

Dear ${appointment.patient?.profile?.firstName || 'Patient'},

Your appointment scheduled for ${date} has been cancelled.\n\nReason: ${reason}\n\nIf you have any questions, please contact us.\n\nAppointments 360
    `.trim();
  }

  async sendCancellationNotice(appointment: any, reason: string) {
    const message = this.formatCancellationMessage(appointment, reason);

    return this.sendNotification({
      userId: appointment.patientId,
      type: NotificationType.APPOINTMENT_CANCELLATION,
      recipient:
        appointment.patient?.oneSignalPlayerId ||
        appointment.patient?.email ||
        appointment.patient?.phone,
      subject: 'Appointment Cancelled',
      content: message,
      provider: appointment.patient?.oneSignalPlayerId
        ? ProviderType.ONESIGNAL
        : appointment.patient?.phone
          ? ProviderType.WHATSAPP
          : ProviderType.EMAIL,
      data: {
        appointmentId: appointment.id,
        type: NotificationType.APPOINTMENT_CANCELLATION,
        reason,
      },
    });
  }

  async sendEmergencyNotification(message: string, affectedPatients: any[]) {
    const results = [];

    for (const patient of affectedPatients) {
      // Prioritize OneSignal if playerId is available
      if (patient.oneSignalPlayerId) {
        const oneSignalResult = await this.sendNotification({
          userId: patient.id,
          type: NotificationType.EMERGENCY_NOTIFICATION,
          recipient: patient.oneSignalPlayerId,
          subject: 'Urgent Notice - Appointment Affected',
          content: message,
          provider: ProviderType.ONESIGNAL,
          data: { type: NotificationType.EMERGENCY_NOTIFICATION },
        });
        results.push(oneSignalResult);
      }

      // Fallback to other methods if OneSignal is not sent or not available, or as secondary notifications
      if (!patient.oneSignalPlayerId) {
        // Only send if OneSignal was not an option or not sent
        const emailResult = await this.sendNotification({
          userId: patient.id,
          type: NotificationType.EMERGENCY_NOTIFICATION,
          recipient: patient.email,
          subject: 'Urgent Notice - Appointment Affected',
          content: message,
          provider: ProviderType.EMAIL,
          data: { type: NotificationType.EMERGENCY_NOTIFICATION },
        });
        results.push(emailResult);

        if (patient.phone) {
          const whatsappResult = await this.sendNotification({
            userId: patient.id,
            type: NotificationType.EMERGENCY_NOTIFICATION,
            recipient: patient.phone,
            subject: 'Urgent Notice - Appointment Affected',
            content: message,
            provider: ProviderType.WHATSAPP,
            data: { type: NotificationType.EMERGENCY_NOTIFICATION },
          });
          results.push(whatsappResult);
        }
        if (patient.telegramChatId) {
          const telegramResult = await this.sendNotification({
            userId: patient.id,
            type: NotificationType.EMERGENCY_NOTIFICATION,
            recipient: patient.telegramChatId,
            subject: 'Urgent Notice - Appointment Affected',
            content: message,
            provider: ProviderType.TELEGRAM,
            data: { type: NotificationType.EMERGENCY_NOTIFICATION },
          });
          results.push(telegramResult);
        }
      }
    }

    return results;
  }
}
