import { Injectable, Logger } from '@nestjs/common';
import { ProviderType } from '../dto/notification.dto';
import {
  INotificationProvider,
  SendResult,
} from '../interfaces/notification-provider.interface';
import { NotificationConfigService } from '../services/notification-config.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailProvider implements INotificationProvider {
  readonly type = ProviderType.EMAIL;
  private readonly logger = new Logger(EmailProvider.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private configService: NotificationConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const config = this.configService.getEmailConfig();
    if (config) {
      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.port === 465,
        auth: {
          user: config.user,
          pass: config.pass,
        },
      });
      this.logger.log(`Email transporter configured for ${config.host}`);
    } else {
      this.logger.warn(
        'Email transporter not initialized: SMTP configuration missing.',
      );
    }
  }

  isConfigured(): boolean {
    return this.transporter !== null;
  }

  async send(
    recipient: string,
    content: string,
    subject?: string,
  ): Promise<SendResult> {
    if (!this.transporter) {
      this.logger.warn('Email transporter is null. Simulating send.');
      return this.simulateSend(recipient, subject, content);
    }

    const from = this.configService.getEmailFrom();
    if (!from) {
      this.logger.error('EMAIL_FROM not configured. Cannot send.');
      return { success: false, error: 'Email sender not configured' };
    }

    try {
      const mailOptions: nodemailer.SendMailOptions = {
        from,
        to: recipient,
        subject: subject || 'System Notification',
        text: content,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${recipient}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      this.logger.error(`Email send failed for ${recipient}:`, error);
      return { success: false, error: error.message };
    }
  }

  private simulateSend(
    recipient: string,
    subject?: string,
    body?: string,
  ): SendResult {
    this.logger.log(
      `[Email] Simulated send to ${recipient}: ${subject || 'No subject'}`,
    );
    if (body) {
      this.logger.debug(`[SIMULATED EMAIL BODY]: ${body.substring(0, 100)}...`);
    }
    return { success: true, messageId: `email-simulated-${Date.now()}` };
  }
}
