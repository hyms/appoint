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
    // Verify professional exists and has PROFESSIONAL role
    const professional = await this.prisma.user.findUnique({
      where: { id: professionalId },
    });

    if (!professional || professional.role !== 'PROFESSIONAL') {
      throw new ForbiddenException('Only professionals can create strikes');
    }

    // Verify patient exists and is a PATIENT
    const patient = await this.prisma.user.findUnique({
      where: { id: dto.patientId },
      include: { profile: true },
    });

    if (!patient || patient.role !== 'PATIENT') {
      throw new NotFoundException('Patient not found');
    }

    // Check if patient already has an active strike with THIS professional
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

    // Check cooldown period (1 hour between strikes from same professional)
    const recentStrike = await this.prisma.strike.findFirst({
      where: {
        patientId: dto.patientId,
        professionalId,
        strikeDate: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });

    if (recentStrike) {
      throw new BadRequestException(
        'Please wait at least 1 hour between strikes for the same patient',
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

    // Only block slots for THIS professional, not all
    await this.blockPatientSlotsForProfessional(dto.patientId, professionalId, blockedUntil);

    return {
      ...strike,
      blockedUntil,
      message: `Patient blocked for ${this.BLOCK_DURATION_DAYS} days with this professional`,
    };
  }

  // Get strikes for a specific patient (for patient view)
  async getMyStrikes(patientId: string) {
    return this.prisma.strike.findMany({
      where: { patientId },
      include: {
        professional: { include: { profile: true } },
      },
      orderBy: { strikeDate: 'desc' },
    });
  }

  // Get strikes created by a professional (for professional view)
  async getProfessionalStrikes(professionalId: string) {
    return this.prisma.strike.findMany({
      where: { professionalId },
      include: {
        patient: { include: { profile: true } },
      },
      orderBy: { strikeDate: 'desc' },
    });
  }

  // Admin: Get all strikes or filter by patient/professional
  async getAllStrikes(filters?: { patientId?: string; professionalId?: string }) {
    const where: any = {};
    if (filters?.patientId) where.patientId = filters.patientId;
    if (filters?.professionalId) where.professionalId = filters.professionalId;

    return this.prisma.strike.findMany({
      where,
      include: {
        patient: { include: { profile: true } },
        professional: { include: { profile: true } },
      },
      orderBy: { strikeDate: 'desc' },
    });
  }

  async resolveStrike(
    strikeId: string,
    dto: ResolveStrikeDto,
    userId: string,
    userRole: string,
  ) {
    const strike = await this.prisma.strike.findUnique({
      where: { id: strikeId },
    });

    if (!strike) {
      throw new NotFoundException('Strike not found');
    }

    // Admin can resolve any strike
    // Professional can only resolve their own strikes
    if (userRole !== 'ADMIN' && strike.professionalId !== userId) {
      throw new ForbiddenException(
        'Only the professional who created the strike or an admin can resolve it',
      );
    }

    const updatedStrike = await this.prisma.strike.update({
      where: { id: strikeId },
      data: {
        isActive: false,
        blockedUntil: null,
        resolution: dto.resolution,
      },
    });

    // Unblock only slots for THIS professional
    await this.unblockPatientSlotsForProfessional(strike.patientId, strike.professionalId);

    return {
      ...updatedStrike,
      message: 'Strike resolved and patient unblocked',
    };
  }

  // Check if patient is blocked with a SPECIFIC professional
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

  // Get all strikes for a patient with a specific professional
  async getPatientStrikesWithProfessional(patientId: string, professionalId: string) {
    return this.prisma.strike.findMany({
      where: { patientId, professionalId },
      include: {
        professional: { include: { profile: true } },
      },
      orderBy: { strikeDate: 'desc' },
    });
  }

  // Check if patient is blocked with ANY professional (for admin overview)
  async isPatientBlockedGlobally(
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

  async cancelUpcomingAppointmentsForBlockedPatient(patientId: string, professionalId: string) {
    const isBlocked = await this.checkPatientBlocked(patientId, professionalId);

    if (!isBlocked) {
      return { cancelled: 0, message: 'Patient is not blocked with this professional' };
    }

    // Only cancel appointments with THIS professional
    const cancelledAppointments = await this.prisma.appointment.updateMany({
      where: {
        patientId,
        professionalId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        date: { gte: new Date() },
      },
      data: {
        status: 'CANCELLED',
        notes: `Appointment cancelled due to patient block`,
      },
    });

    return {
      cancelled: cancelledAppointments.count,
      message: `${cancelledAppointments.count} appointments cancelled`,
    };
  }

  // Only block slots for THIS professional
  private async blockPatientSlotsForProfessional(
    patientId: string,
    professionalId: string,
    blockedUntil: Date,
  ) {
    const patientAppointments = await this.prisma.appointment.findMany({
      where: {
        patientId,
        professionalId,
        date: { gte: new Date(), lte: blockedUntil },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      include: { slot: true },
    });

    const slotIds = patientAppointments
      .filter((apt) => apt.slotId)
      .map((apt) => apt.slotId as string);

    if (slotIds.length > 0) {
      // Cancel the appointments instead of modifying slots
      await this.prisma.appointment.updateMany({
        where: { id: { in: patientAppointments.map((apt) => apt.id) } },
        data: {
          status: 'CANCELLED',
          notes: 'Cancelled due to strike',
        },
      });

      // Mark slots as available again
      await this.prisma.slot.updateMany({
        where: { id: { in: slotIds } },
        data: {
          isBooked: false,
          isBlocked: false,
          blockReason: null,
        },
      });
    }
  }

  // Only unblock for THIS professional
  private async unblockPatientSlotsForProfessional(
    patientId: string,
    professionalId: string,
  ) {
    // No need to unblock slots - they were already made available when cancelled
    // This method is kept for future use if needed
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
