import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SendNotificationDto, NotificationType, ProviderType } from './dto/notification.dto';

@Injectable()
export class NotificationProvider {
  private readonly logger = new Logger(NotificationProvider.name);

  constructor(private prisma: PrismaService) {}

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
      let result: { success: boolean; messageId?: string };

      switch (dto.provider) {
        case ProviderType.WHATSAPP:
          result = await this.sendWhatsApp(dto.recipient, dto.content);
          break;
        case ProviderType.TELEGRAM:
          result = await this.sendTelegram(dto.recipient, dto.content);
          break;
        default:
          result = await this.sendEmail(dto.recipient, dto.subject || '', dto.content);
      }

      const updatedNotification = await this.prisma.notificationLog.update({
        where: { id: notification.id },
        data: {
          status: result.success ? 'SENT' : 'FAILED',
          sentAt: result.success ? new Date() : null,
          errorMessage: result.success ? null : 'Sending failed',
        },
      });

      return updatedNotification;
    } catch (error) {
      this.logger.error(`Failed to send notification ${notification.id}:`, error);
      
      return this.prisma.notificationLog.update({
        where: { id: notification.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
        },
      });
    }
  }

  async sendWhatsApp(phone: string, message: string): Promise<{ success: boolean; messageId?: string }> {
    const whatsappToken = process.env.WHATSAPP_TOKEN;
    const whatsappPhoneId = process.env.WHATSAPP_PHONE_ID;

    if (!whatsappToken || !whatsappPhoneId) {
      this.logger.warn('WhatsApp credentials not configured. Simulating send.');
      return this.simulateSend(phone, 'WhatsApp', message);
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${whatsappPhoneId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${whatsappToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phone,
            type: 'text',
            text: { body: message },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, messageId: data.messages?.[0]?.id };
    } catch (error) {
      this.logger.error('WhatsApp send failed:', error);
      return { success: false };
    }
  }

  async sendTelegram(chatId: string, message: string): Promise<{ success: boolean; messageId?: string }> {
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!telegramToken) {
      this.logger.warn('Telegram credentials not configured. Simulating send.');
      return this.simulateSend(chatId, 'Telegram', message);
    }

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${telegramToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML',
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, messageId: data.result?.message_id?.toString() };
    } catch (error) {
      this.logger.error('Telegram send failed:', error);
      return { success: false };
    }
  }

  async sendEmail(to: string, subject: string, body: string): Promise<{ success: boolean; messageId?: string }> {
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;

    if (!smtpHost || !smtpUser) {
      this.logger.warn('Email credentials not configured. Simulating send.');
      return this.simulateSend(to, 'Email', `${subject}: ${body}`);
    }

    console.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
    console.log(`[EMAIL] Body: ${body}`);
    
    return { success: true, messageId: `email-${Date.now()}` };
  }

  private simulateSend(recipient: string, provider: string, message: string) {
    this.logger.log(`[${provider}] Simulated send to ${recipient}: ${message.substring(0, 50)}...`);
    return { success: true, messageId: `simulated-${Date.now()}` };
  }

  async sendAppointmentReminder(appointment: any) {
    const patient = appointment.patient;
    const professional = appointment.professional;

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
    const time = new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
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
    const time = new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
