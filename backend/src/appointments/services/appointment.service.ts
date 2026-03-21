import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentStatusDto,
  CancelAppointmentDto,
  UpdateAppointmentDto,
} from '../dto/appointment.dto';
import { StrikeService } from '../../strikes/services/strike.service';
import { AuthorizationService } from '../../common/services/authorization.service';
import {
  AppointmentAuditService,
  AuditAction,
} from './appointment-audit.service';
import { NotificationProviderService } from '../../notifications/services/notification-provider.service';
import { ProviderType } from '../../notifications/dto/notification.dto';
import { NotificationType } from '@prisma/client';
import { Permission } from '../../common/enums/permissions.enum';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private strikeService: StrikeService,
    private authService: AuthorizationService,
    private auditService: AppointmentAuditService,
    private notificationService: NotificationProviderService,
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
    const {
      page,
      limit,
      status,
      patientId,
      professionalId,
      startDate,
      endDate,
    } = params;
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
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const updateData: any = {};
    if (dto.patientId) updateData.patientId = dto.patientId;
    if (dto.professionalId) updateData.professionalId = dto.professionalId;
    if (dto.slotId) {
      const slot = await this.prisma.slot.findUnique({
        where: { id: dto.slotId },
      });
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

  async deleteAppointment(id: string, userId?: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (
      appointment.status !== 'CANCELLED' &&
      appointment.status !== 'NO_SHOW'
    ) {
      throw new BadRequestException(
        'Only cancelled or no-show appointments can be deleted',
      );
    }

    const oldStatus = appointment.status;

    await this.prisma.appointment.delete({ where: { id } });

    if (appointment.slotId) {
      await this.prisma.slot.update({
        where: { id: appointment.slotId },
        data: { isBooked: false },
      });
    }

    if (userId) {
      await this.auditService.logChange({
        appointmentId: id,
        userId,
        action: AuditAction.DELETE,
        oldStatus,
        newStatus: 'DELETED',
      });
    }

    return { message: 'Appointment deleted successfully' };
  }

  async createAppointment(
    dto: CreateAppointmentDto,
    userId: string,
    userRole: string,
  ) {
    const patientId = dto.patientId || userId;

    if (!this.authService.canBookForOthers(userRole, userId, patientId)) {
      throw new ForbiddenException(
        'You can only book appointments for yourself',
      );
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

    // Check if patient is blocked with THIS specific professional
    const isBlocked = await this.strikeService.checkPatientBlocked(
      patientId,
      dto.professionalId,
    );
    if (isBlocked) {
      throw new BadRequestException(
        'Patient is currently blocked with this professional and cannot book appointments',
      );
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        patientId: patientId,
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

    await this.auditService.logChange({
      appointmentId: appointment.id,
      userId: userId,
      action: AuditAction.CREATE,
      newStatus: 'PENDING',
    });

    // Notify Professional
    if (appointment.professional.oneSignalPlayerId) {
      await this.notificationService.sendNotification({
        userId: appointment.professionalId,
        type: NotificationType.OTHER, // Or a specific type for professional notifications
        recipient: appointment.professional.oneSignalPlayerId,
        subject: 'New Appointment Request',
        content: `New appointment request from ${appointment.patient.profile?.firstName} ${appointment.patient.profile?.lastName}`,
        provider: ProviderType.ONESIGNAL,
        data: { appointmentId: appointment.id, type: 'new-appointment' },
      });
    }

    return appointment;
  }

  async getAppointmentById(
    appointmentId: string,
    userId: string,
    userRole: string,
  ) {
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

    if (
      !this.authService.canAccessAppointment(
        userRole,
        userId,
        appointment.patientId,
        appointment.professionalId,
      )
    ) {
      throw new ForbiddenException('Access denied');
    }

    return appointment;
  }

  async updateStatus(
    appointmentId: string,
    dto: UpdateAppointmentStatusDto,
    userId: string,
    userRole: string,
  ) {
    const appointment = await this.getAppointmentById(
      appointmentId,
      userId,
      userRole,
    );

    if (
      !this.authService.canUpdateAppointmentStatus(
        userRole,
        userId,
        appointment.professionalId,
      )
    ) {
      throw new ForbiddenException(
        'Only professionals or staff can update appointment status',
      );
    }

    const updateData: any = { status: dto.status };

    if (dto.status === 'NO_SHOW') {
      // Validate: Only the assigned professional can mark NO_SHOW
      if (
        !this.authService.isAdmin(userRole) &&
        appointment.professionalId !== userId
      ) {
        throw new ForbiddenException(
          'Only the assigned professional can mark an appointment as NO_SHOW',
        );
      }

      // Validate: Appointment date must be in the past
      const appointmentDate = new Date(appointment.date);
      const now = new Date();
      if (appointmentDate > now) {
        throw new BadRequestException(
          'Cannot mark as NO_SHOW for future appointments',
        );
      }

      // Validate: Must provide a reason for NO_SHOW
      if (!dto.notes || dto.notes.length < 10) {
        throw new BadRequestException(
          'Please provide a detailed reason for the NO_SHOW (at least 10 characters)',
        );
      }

      await this.strikeService.createStrike(userId, {
        patientId: appointment.patientId,
        reason: dto.notes || 'No show for scheduled appointment',
        appointmentId: appointment.id,
      });
    }

    if (dto.notes) {
      updateData.notes = dto.notes;
    }

    return this.prisma.appointment
      .update({
        where: { id: appointmentId },
        data: updateData,
        include: {
          patient: { include: { profile: true } },
          professional: { include: { profile: true } },
        },
      })
      .then(async (updated) => {
        await this.auditService.logChange({
          appointmentId: updated.id,
          userId: userId,
          action: AuditAction.UPDATE_STATUS,
          oldStatus: appointment.status,
          newStatus: dto.status,
          reason: dto.notes,
        });

        // Notify Patient (if OneSignalPlayerId exists)
        if (updated.patient.oneSignalPlayerId) {
          await this.notificationService.sendNotification({
            userId: updated.patientId,
            type: NotificationType.APPOINTMENT_REMINDER, // Reusing reminder type, or a new specific type for status updates
            recipient: updated.patient.oneSignalPlayerId,
            subject: 'Appointment Status Update',
            content: `Your appointment status has been updated to ${dto.status}`,
            provider: ProviderType.ONESIGNAL,
            data: { appointmentId: updated.id, status: dto.status },
          });
        }

        // Also send generic notification via NotificationProviderService
        await this.notificationService.sendNotification({
          userId: updated.patientId,
          type: NotificationType.APPOINTMENT_REMINDER, // Or a new specific type for status updates
          recipient: updated.patient.email, // Default to email
          subject: 'Appointment Status Update',
          content: `Your appointment with Dr. ${updated.professional.profile?.lastName} on ${new Date(updated.date).toLocaleDateString()} at ${new Date(updated.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} has been updated to ${dto.status}.`,
          // provider: ProviderType.EMAIL, // Let the service decide the best provider
        });

        return updated;
      });
  }

  async cancelAppointment(
    appointmentId: string,
    dto: CancelAppointmentDto,
    userId: string,
    userRole: string,
  ) {
    const appointment = await this.getAppointmentById(
      appointmentId,
      userId,
      userRole,
    );

    if (appointment.status === 'CANCELLED') {
      throw new BadRequestException('Appointment is already cancelled');
    }

    if (
      !this.authService.canCancelAppointment(
        userRole,
        userId,
        appointment.patientId,
        appointment.professionalId,
      )
    ) {
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

    await this.auditService.logChange({
      appointmentId: updatedAppointment.id,
      userId: userId,
      action: AuditAction.CANCEL,
      oldStatus: appointment.status,
      newStatus: 'CANCELLED',
      reason: dto.reason,
    });

    // Notify both participants (if OneSignalPlayerId exists)
    const patientPlayerId = appointment.patient.oneSignalPlayerId;
    const professionalPlayerId = appointment.professional.oneSignalPlayerId;

    if (patientPlayerId) {
      await this.notificationService.sendNotification({
        userId: appointment.patientId,
        type: NotificationType.APPOINTMENT_CANCELLATION,
        recipient: patientPlayerId,
        subject: 'Appointment Cancelled',
        content: `Your appointment with Dr. ${appointment.professional.profile?.lastName} on ${new Date(appointment.date).toLocaleDateString()} at ${new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} has been cancelled. Reason: ${dto.reason}`,
        provider: ProviderType.ONESIGNAL,
        data: { appointmentId: appointment.id, action: 'CANCELLED' },
      });
    }

    if (professionalPlayerId) {
      await this.notificationService.sendNotification({
        userId: appointment.professionalId,
        type: NotificationType.APPOINTMENT_CANCELLATION,
        recipient: professionalPlayerId,
        subject: 'Appointment Cancelled',
        content: `An appointment for ${appointment.patient.profile?.firstName} ${appointment.patient.profile?.lastName} on ${new Date(appointment.date).toLocaleDateString()} at ${new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} has been cancelled. Reason: ${dto.reason}`,
        provider: ProviderType.ONESIGNAL,
        data: { appointmentId: appointment.id, action: 'CANCELLED' },
      });
    }

    // Also send generic notification via NotificationProviderService to patient
    await this.notificationService.sendNotification({
      userId: appointment.patientId,
      type: NotificationType.APPOINTMENT_CANCELLATION,
      recipient: appointment.patient.email,
      subject: 'Appointment Cancelled',
      content: `Your appointment with Dr. ${appointment.professional.profile?.lastName} on ${new Date(appointment.date).toLocaleDateString()} at ${new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} has been cancelled. Reason: ${dto.reason}`,
    });

    // Also send generic notification via NotificationProviderService to professional
    await this.notificationService.sendNotification({
      userId: appointment.professionalId,
      type: NotificationType.APPOINTMENT_CANCELLATION,
      recipient: appointment.professional.email,
      subject: 'Appointment Cancelled',
      content: `An appointment for ${appointment.patient.profile?.firstName} ${appointment.patient.profile?.lastName} on ${new Date(appointment.date).toLocaleDateString()} at ${new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} has been cancelled. Reason: ${dto.reason}`,
    });

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

  async getProfessionalAppointments(
    professionalId: string,
    startDate?: string,
    endDate?: string,
  ) {
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
