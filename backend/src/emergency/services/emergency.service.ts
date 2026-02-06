import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivateEmergencyDto, DeactivateEmergencyDto } from './dto/emergency.dto';

@Injectable()
export class EmergencyService {
  constructor(private prisma: PrismaService) {}

  async activateEmergency(dto: ActivateEmergencyDto) {
    const emergency = await this.prisma.emergencyButton.findFirst();

    if (!emergency) {
      throw new NotFoundException('Emergency button not configured');
    }

    if (emergency.isActive) {
      throw new BadRequestException('Emergency mode is already active');
    }

    const affectedDays = dto.affectedDays || emergency.affectedDays;
    const blockedUntil = new Date();
    blockedUntil.setDate(blockedUntil.getDate() + affectedDays);

    const updatedEmergency = await this.prisma.emergencyButton.update({
      where: { id: emergency.id },
      data: {
        isActive: true,
        activatedAt: new Date(),
        message: dto.message,
        affectedDays,
      },
    });

    await this.blockUpcomingSlots(blockedUntil);

    await this.createMassNotification(dto.message);

    return {
      ...updatedEmergency,
      blockedUntil,
      message: `Emergency mode activated. ${affectedDays} days affected.`,
    };
  }

  async deactivateEmergency(dto: DeactivateEmergencyDto) {
    const emergency = await this.prisma.emergencyButton.findFirst();

    if (!emergency) {
      throw new NotFoundException('Emergency button not configured');
    }

    if (!emergency.isActive) {
      throw new BadRequestException('Emergency mode is not active');
    }

    const updatedEmergency = await this.prisma.emergencyButton.update({
      where: { id: emergency.id },
      data: {
        isActive: false,
        activatedAt: null,
        message: dto.reason,
      },
    });

    return {
      ...updatedEmergency,
      message: 'Emergency mode deactivated',
    };
  }

  async getEmergencyStatus() {
    const emergency = await this.prisma.emergencyButton.findFirst();

    if (!emergency) {
      throw new NotFoundException('Emergency button not configured');
    }

    const affectedAppointments = await this.prisma.appointment.count({
      where: {
        date: { gte: new Date() },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    return {
      ...emergency,
      affectedAppointments,
    };
  }

  private async blockUpcomingSlots(blockedUntil: Date) {
    return this.prisma.slot.updateMany({
      where: {
        date: { lte: blockedUntil },
        isBooked: false,
        isBlocked: false,
      },
      data: {
        isBlocked: true,
        blockReason: 'Emergency: Clinic temporarily closed',
      },
    });
  }

  private async createMassNotification(message: string) {
    const affectedPatients = await this.prisma.appointment.findMany({
      where: {
        date: { gte: new Date() },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      include: { patient: true },
      distinct: ['patientId'],
    });

    const notifications = affectedPatients.map((apt) => ({
      userId: apt.patientId,
      type: 'EMERGENCY_NOTIFICATION' as const,
      recipient: apt.patient.email,
      subject: 'Appointment Affected - Emergency Notice',
      content: `Dear patient,\n\n${message}\n\nYour appointment has been affected. Please contact us to reschedule.\n\nWe apologize for the inconvenience.`,
      status: 'PENDING',
    }));

    if (notifications.length > 0) {
      await this.prisma.notificationLog.createMany({
        data: notifications,
      });
    }

    return {
      notificationsCreated: notifications.length,
      message: 'Mass notifications queued for affected patients',
    };
  }

  async getAffectedPatients() {
    const emergency = await this.prisma.emergencyButton.findFirst();

    if (!emergency || !emergency.isActive) {
      return { affectedPatients: [], message: 'No active emergency' };
    }

    const blockedUntil = new Date();
    blockedUntil.setDate(blockedUntil.getDate() + (emergency.affectedDays || 2));

    const affectedAppointments = await this.prisma.appointment.findMany({
      where: {
        date: {
          gte: new Date(),
          lte: blockedUntil,
        },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      include: {
        patient: { include: { profile: true } },
        professional: { include: { profile: true } },
      },
    });

    return {
      emergencyMessage: emergency.message,
      blockedUntil,
      affectedAppointments: affectedAppointments.length,
      appointments: affectedAppointments,
    };
  }
}
