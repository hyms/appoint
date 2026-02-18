import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStrikeDto, ResolveStrikeDto } from '../dto/strike.dto';

@Injectable()
export class StrikeService {
  private readonly BLOCK_DURATION_DAYS = 2;

  constructor(private prisma: PrismaService) {}

  async createStrike(professionalId: string, dto: CreateStrikeDto) {
    const patient = await this.prisma.user.findUnique({
      where: { id: dto.patientId },
      include: { profile: true },
    });

    if (!patient || patient.role !== 'PATIENT') {
      throw new NotFoundException('Patient not found');
    }

    const activeStrike = await this.prisma.strike.findFirst({
      where: {
        patientId: dto.patientId,
        professionalId,
        isActive: true,
      },
    });

    if (activeStrike) {
      throw new BadRequestException(
        'Patient already has an active strike with this professional',
      );
    }

    const blockedUntil = new Date();
    blockedUntil.setDate(blockedUntil.getDate() + this.BLOCK_DURATION_DAYS);

    const strike = await this.prisma.strike.create({
      data: {
        patientId: dto.patientId,
        professionalId,
        reason: dto.reason,
        blockedUntil,
      },
      include: {
        patient: { include: { profile: true } },
        professional: { include: { profile: true } },
      },
    });

    await this.blockPatientSlots(dto.patientId, blockedUntil);

    return {
      ...strike,
      blockedUntil,
      message: `Patient blocked for ${this.BLOCK_DURATION_DAYS} days`,
    };
  }

  async getPatientStrikes(patientId: string) {
    return this.prisma.strike.findMany({
      where: { patientId },
      include: {
        professional: { include: { profile: true } },
      },
      orderBy: { strikeDate: 'desc' },
    });
  }

  async getProfessionalStrikes(professionalId: string) {
    return this.prisma.strike.findMany({
      where: { professionalId },
      include: {
        patient: { include: { profile: true } },
      },
      orderBy: { strikeDate: 'desc' },
    });
  }

  async resolveStrike(
    strikeId: string,
    dto: ResolveStrikeDto,
    professionalId: string,
  ) {
    const strike = await this.prisma.strike.findUnique({
      where: { id: strikeId },
    });

    if (!strike) {
      throw new NotFoundException('Strike not found');
    }

    if (strike.professionalId !== professionalId) {
      throw new ForbiddenException(
        'Only the professional who created the strike can resolve it',
      );
    }

    const updatedStrike = await this.prisma.strike.update({
      where: { id: strikeId },
      data: {
        isActive: false,
        blockedUntil: null,
      },
    });

    await this.unblockPatientSlots(strike.patientId);

    return {
      ...updatedStrike,
      resolution: dto.resolution,
      message: 'Strike resolved and patient unblocked',
    };
  }

  async checkPatientBlocked(
    patientId: string,
    professionalId: string,
  ): Promise<boolean> {
    const activeStrike = await this.prisma.strike.findFirst({
      where: {
        patientId,
        professionalId,
        isActive: true,
        blockedUntil: { gte: new Date() },
      },
    });

    return !!activeStrike;
  }

  async isPatientBlockedForAny(
    patientId: string,
  ): Promise<{ blocked: boolean; strikes: any[] }> {
    const activeStrikes = await this.prisma.strike.findMany({
      where: {
        patientId,
        isActive: true,
        blockedUntil: { gte: new Date() },
      },
      include: {
        professional: { include: { profile: true } },
      },
    });

    return {
      blocked: activeStrikes.length > 0,
      strikes: activeStrikes,
    };
  }

  async cancelUpcomingAppointmentsForBlockedPatient(patientId: string) {
    const blockedStatus = await this.isPatientBlockedForAny(patientId);

    if (!blockedStatus.blocked) {
      return { cancelled: 0, message: 'Patient is not blocked' };
    }

    const cancelledAppointments = await this.prisma.appointment.updateMany({
      where: {
        patientId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        date: { gte: new Date() },
      },
      data: {
        status: 'CANCELLED',
        notes: `Appointment cancelled due to patient block (${blockedStatus.strikes.length} active strike(s))`,
      },
    });

    return {
      cancelled: cancelledAppointments.count,
      message: `${cancelledAppointments.count} appointments cancelled`,
    };
  }

  private async blockPatientSlots(patientId: string, blockedUntil: Date) {
    const patientAppointments = await this.prisma.appointment.findMany({
      where: {
        patientId,
        date: { gte: new Date(), lte: blockedUntil },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    const slotIds = patientAppointments
      .filter((apt) => apt.slotId)
      .map((apt) => apt.slotId as string);

    if (slotIds.length > 0) {
      await this.prisma.slot.updateMany({
        where: { id: { in: slotIds } },
        data: {
          isBooked: false,
          isBlocked: true,
          blockReason: 'Patient strike: Temporary block',
        },
      });
    }
  }

  private async unblockPatientSlots(patientId: string) {
    const patientAppointments = await this.prisma.appointment.findMany({
      where: {
        patientId,
        status: 'CANCELLED',
        notes: { contains: 'Patient strike' },
      },
    });

    const slotIds = patientAppointments
      .filter((apt) => apt.slotId)
      .map((apt) => apt.slotId as string);

    if (slotIds.length > 0) {
      await this.prisma.slot.updateMany({
        where: { id: { in: slotIds }, isBlocked: true },
        data: {
          isBlocked: false,
          blockReason: null,
        },
      });
    }
  }

  async getStrikeStats(professionalId: string) {
    const totalStrikes = await this.prisma.strike.count({
      where: { professionalId },
    });

    const activeStrikes = await this.prisma.strike.count({
      where: {
        professionalId,
        isActive: true,
        blockedUntil: { gte: new Date() },
      },
    });

    const resolvedStrikes = totalStrikes - activeStrikes;

    return {
      totalStrikes,
      activeStrikes,
      resolvedStrikes,
      resolutionRate:
        totalStrikes > 0
          ? ((resolvedStrikes / totalStrikes) * 100).toFixed(1) + '%'
          : '0%',
    };
  }
}
