import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAppointmentDto, UpdateAppointmentStatusDto, CancelAppointmentDto, UpdateAppointmentDto } from '../dto/appointment.dto';
import { StrikeService } from '../../strikes/services/strike.service';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private strikeService: StrikeService,
  ) {}

  // ============ ADMIN CRUD ============

  async getAllAppointments(params: {
    page: number;
    limit: number;
    status?: string;
    patientId?: string;
    professionalId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { page, limit, status, patientId, professionalId, startDate, endDate } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (patientId) where.patientId = patientId;
    if (professionalId) where.professionalId = professionalId;
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          patient: { include: { profile: true } },
          professional: { include: { profile: true } },
          location: true,
          slot: true,
        },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      data: appointments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAppointmentByIdAdmin(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: { include: { profile: true } },
        professional: { include: { profile: true } },
        location: true,
        slot: true,
        payment: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  async updateAppointment(id: string, dto: UpdateAppointmentDto) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const updateData: any = {};
    if (dto.patientId) updateData.patientId = dto.patientId;
    if (dto.professionalId) updateData.professionalId = dto.professionalId;
    if (dto.slotId) {
      const slot = await this.prisma.slot.findUnique({ where: { id: dto.slotId } });
      if (slot) {
        updateData.slotId = dto.slotId;
        updateData.date = slot.date;
        updateData.startTime = slot.startTime;
        updateData.endTime = slot.endTime;
      }
    }
    if (dto.locationId) updateData.locationId = dto.locationId;
    if (dto.date) updateData.date = new Date(dto.date);
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    return this.prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: { include: { profile: true } },
        professional: { include: { profile: true } },
        location: true,
        slot: true,
      },
    });
  }

  async deleteAppointment(id: string) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status !== 'CANCELLED' && appointment.status !== 'NO_SHOW') {
      throw new BadRequestException('Only cancelled or no-show appointments can be deleted');
    }

    await this.prisma.appointment.delete({ where: { id } });

    if (appointment.slotId) {
      await this.prisma.slot.update({
        where: { id: appointment.slotId },
        data: { isBooked: false },
      });
    }

    return { message: 'Appointment deleted successfully' };
  }

  async createAppointment(dto: CreateAppointmentDto, userId: string, userRole: string) {
    // Validate patientId authorization
    // Patients can only book for themselves
    // Admin, Secretary, and Professional can book for any patient
    if (dto.patientId !== userId && !['ADMIN', 'SECRETARY', 'PROFESSIONAL'].includes(userRole)) {
      throw new ForbiddenException('You can only book appointments for yourself');
    }

    const slot = await this.prisma.slot.findUnique({
      where: { id: dto.slotId },
    });

    if (!slot) {
      throw new NotFoundException('Slot not found');
    }

    if (slot.isBooked || slot.isBlocked) {
      throw new BadRequestException('Slot is not available');
    }

    const isBlocked = await this.strikeService.isPatientBlockedForAny(dto.patientId);
    if (isBlocked.blocked) {
      throw new BadRequestException('Patient is currently blocked and cannot book appointments');
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        patientId: dto.patientId,
        professionalId: dto.professionalId,
        locationId: dto.locationId || slot.locationId,
        slotId: dto.slotId,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        notes: dto.notes,
        status: 'PENDING',
      },
      include: {
        patient: { include: { profile: true } },
        professional: { include: { profile: true } },
        location: true,
        slot: true,
      },
    });

    await this.prisma.slot.update({
      where: { id: dto.slotId },
      data: { isBooked: true },
    });

    return appointment;
  }

  async getAppointmentById(appointmentId: string, userId: string, userRole: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { include: { profile: true } },
        professional: { include: { profile: true } },
        location: true,
        slot: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const canAccess = 
      userRole === 'ADMIN' ||
      userRole === 'SECRETARY' ||
      appointment.patientId === userId ||
      appointment.professionalId === userId;

    if (!canAccess) {
      throw new ForbiddenException('Access denied');
    }

    return appointment;
  }

  async updateStatus(appointmentId: string, dto: UpdateAppointmentStatusDto, userId: string, userRole: string) {
    const appointment = await this.getAppointmentById(appointmentId, userId, userRole);

    const canUpdate = 
      userRole === 'ADMIN' ||
      userRole === 'SECRETARY' ||
      appointment.professionalId === userId;

    if (!canUpdate) {
      throw new ForbiddenException('Only professionals or staff can update appointment status');
    }

    const updateData: any = { status: dto.status };

    if (dto.status === 'NO_SHOW') {
      await this.strikeService.createStrike(userId, {
        patientId: appointment.patientId,
        reason: 'No show for scheduled appointment',
      });
    }

    if (dto.notes) {
      updateData.notes = dto.notes;
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
      include: {
        patient: { include: { profile: true } },
        professional: { include: { profile: true } },
      },
    });
  }

  async cancelAppointment(appointmentId: string, dto: CancelAppointmentDto, userId: string, userRole: string) {
    const appointment = await this.getAppointmentById(appointmentId, userId, userRole);

    if (appointment.status === 'CANCELLED') {
      throw new BadRequestException('Appointment is already cancelled');
    }

    const canCancel = 
      userRole === 'ADMIN' ||
      userRole === 'SECRETARY' ||
      appointment.patientId === userId ||
      appointment.professionalId === userId;

    if (!canCancel) {
      throw new ForbiddenException('You cannot cancel this appointment');
    }

    const [updatedAppointment] = await this.prisma.$transaction([
      this.prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status: 'CANCELLED',
          notes: `Cancelled: ${dto.reason}`,
        },
      }),
      this.prisma.slot.update({
        where: { id: appointment.slotId! },
        data: { isBooked: false },
      }),
    ]);

    return updatedAppointment;
  }

  async getPatientAppointments(patientId: string) {
    return this.prisma.appointment.findMany({
      where: { patientId },
      include: {
        professional: { include: { profile: true } },
        location: true,
        slot: true,
      },
      orderBy: { date: 'asc' },
    });
  }

  async getProfessionalAppointments(professionalId: string, startDate?: string, endDate?: string) {
    const where: any = { professionalId };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    return this.prisma.appointment.findMany({
      where,
      include: {
        patient: { include: { profile: true } },
        location: true,
        slot: true,
      },
      orderBy: { date: 'asc' },
    });
  }

  async getUpcomingAppointments(userId: string, role: string) {
    const where: any = {
      date: { gte: new Date() },
      status: { in: ['PENDING', 'CONFIRMED'] },
    };

    if (role === 'PATIENT') {
      where.patientId = userId;
    } else if (role === 'PROFESSIONAL') {
      where.professionalId = userId;
    }

    return this.prisma.appointment.findMany({
      where,
      include: {
        patient: { include: { profile: true } },
        professional: { include: { profile: true } },
        location: true,
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }
}
