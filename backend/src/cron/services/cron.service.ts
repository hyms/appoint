import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationProvider } from '../../notifications/services/notification-provider.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private prisma: PrismaService,
    private notificationProvider: NotificationProvider,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async processAppointmentReminders() {
    this.logger.log('Running appointment reminder cron job...');

    const now = new Date();
    const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const sixHoursLater = new Date(now.getTime() + 6 * 60 * 60 * 1000);

    const pendingAppointments = await this.prisma.appointment.findMany({
      where: {
        status: { in: ['PENDING', 'CONFIRMED'] },
        date: {
          gte: now,
          lte: sixHoursLater,
        },
        notificationSent24h: false,
      },
      include: {
        patient: { include: { profile: true } },
        professional: { include: { profile: true } },
        location: true,
      },
    });

    this.logger.log(
      `Found ${pendingAppointments.length} appointments for reminders.`,
    );

    for (const appointment of pendingAppointments) {
      try {
        const appointmentTime = new Date(appointment.startTime);
        const hoursUntilAppointment =
          (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (
          hoursUntilAppointment <= 24 &&
          hoursUntilAppointment > 6 &&
          !appointment.notificationSent24h
        ) {
          await this.notificationProvider.sendAppointmentReminder(appointment);

          await this.prisma.appointment.update({
            where: { id: appointment.id },
            data: { notificationSent24h: true },
          });

          this.logger.log(
            `24h reminder sent for appointment ${appointment.id}`,
          );
        }

        if (hoursUntilAppointment <= 6 && !appointment.notificationSent6h) {
          await this.notificationProvider.sendAppointmentReminder(appointment);

          await this.prisma.appointment.update({
            where: { id: appointment.id },
            data: { notificationSent6h: true },
          });

          this.logger.log(`6h reminder sent for appointment ${appointment.id}`);
        }
      } catch (error) {
        this.logger.error(
          `Failed to send reminder for appointment ${appointment.id}:`,
          error,
        );
      }
    }

    this.logger.log('Appointment reminder cron job completed.');
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldNotifications() {
    this.logger.log('Running notification cleanup cron job...');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deleted = await this.prisma.notificationLog.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo },
        status: 'SENT',
      },
    });

    this.logger.log(`Cleaned up ${deleted.count} old notifications.`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async dailyAppointmentSummary() {
    this.logger.log('Running daily summary cron job...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysAppointments = await this.prisma.appointment.findMany({
      where: {
        date: { gte: today, lt: tomorrow },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      include: {
        patient: { include: { profile: true } },
        professional: { include: { profile: true } },
      },
    });

    const summary = {
      total: todaysAppointments.length,
      pending: todaysAppointments.filter((a) => a.status === 'PENDING').length,
      confirmed: todaysAppointments.filter((a) => a.status === 'CONFIRMED')
        .length,
    };

    this.logger.log(`Daily summary: ${JSON.stringify(summary)}`);
  }

  @Cron(CronExpression.EVERY_WEEK)
  async autoCancelNoShowAttempts() {
    this.logger.log('Running auto-cancel no-show cron job...');

    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

    const missedAppointments = await this.prisma.appointment.findMany({
      where: {
        status: 'CONFIRMED',
        startTime: { lt: twoHoursAgo },
      },
    });

    for (const appointment of missedAppointments) {
      await this.prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          status: 'NO_SHOW',
          notes: (appointment.notes || '') + '\nAuto-marked as no-show',
        },
      });

      this.logger.log(`Appointment ${appointment.id} marked as no-show`);
    }

    this.logger.log(
      `Auto-cancel job completed. ${missedAppointments.length} appointments marked as no-show.`,
    );
  }
}
