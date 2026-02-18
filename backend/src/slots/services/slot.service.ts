import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GenerateSlotsDto, BlockSlotDto, UpdateSlotDto } from '../dto/slot.dto';

@Injectable()
export class SlotService {
  constructor(private prisma: PrismaService) {}

  // ============ ADMIN CRUD ============

  async getAllSlots(params: {
    page: number;
    limit: number;
    professionalId?: string;
    date?: string;
    isBooked?: boolean;
  }) {
    const { page, limit, professionalId, date, isBooked } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (professionalId) where.professionalId = professionalId;
    if (date) where.date = new Date(date);
    if (isBooked !== undefined) where.isBooked = isBooked;

    const [slots, total] = await Promise.all([
      this.prisma.slot.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          professional: { include: { profile: true } },
          location: true,
        },
      }),
      this.prisma.slot.count({ where }),
    ]);

    return {
      data: slots,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSlotById(id: string) {
    const slot = await this.prisma.slot.findUnique({
      where: { id },
      include: {
        professional: { include: { profile: true } },
        location: true,
        appointment: true,
      },
    });

    if (!slot) {
      throw new NotFoundException('Slot not found');
    }

    return slot;
  }

  async updateSlot(id: string, dto: UpdateSlotDto) {
    const slot = await this.prisma.slot.findUnique({ where: { id } });

    if (!slot) {
      throw new NotFoundException('Slot not found');
    }

    return this.prisma.slot.update({
      where: { id },
      data: dto,
      include: {
        professional: { include: { profile: true } },
      },
    });
  }

  async deleteSlot(id: string) {
    const slot = await this.prisma.slot.findUnique({ where: { id } });

    if (!slot) {
      throw new NotFoundException('Slot not found');
    }

    if (slot.isBooked) {
      throw new BadRequestException('Cannot delete a booked slot');
    }

    await this.prisma.slot.delete({ where: { id } });

    return { message: 'Slot deleted successfully' };
  }

  async generateSlots(dto: GenerateSlotsDto) {
    const professional = await this.prisma.user.findUnique({
      where: { id: dto.professionalId },
    });

    if (!professional || professional.role !== 'PROFESSIONAL') {
      throw new NotFoundException('Professional not found');
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const currentDate = new Date(startDate);

    const generatedSlots = [];
    const defaultDuration = 30;
    const defaultBreak = 5;

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate
        .toLocaleDateString('en-US', { weekday: 'long' })
        .toUpperCase();

      const workingHours = await this.getWorkingHoursForDay(
        dto.professionalId,
        dayOfWeek,
      );

      if (workingHours && workingHours.isActive) {
        const slots = this.createSlotsForDay(
          new Date(currentDate),
          workingHours.startTime,
          workingHours.endTime,
          dto.professionalId,
          dto.locationId,
          defaultDuration,
          defaultBreak,
        );
        generatedSlots.push(...slots);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    const createdSlots = await this.prisma.slot.createMany({
      data: generatedSlots,
      skipDuplicates: true,
    });

    return {
      message: `Generated ${createdSlots.count} slots`,
      count: createdSlots.count,
    };
  }

  private async getWorkingHoursForDay(
    _professionalId: string,
    dayOfWeek: string,
  ) {
    // Using default working hours - professional config can be added later
    return {
      dayOfWeek,
      startTime: '09:00',
      endTime: '17:00',
      isActive: true,
    };
  }

  private createSlotsForDay(
    date: Date,
    startTime: string,
    endTime: string,
    professionalId: string,
    locationId: string | undefined,
    durationMinutes: number,
    breakMinutes: number,
  ) {
    const slots = [];
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    let currentSlotStart = new Date(date);
    currentSlotStart.setHours(startHour, startMinute, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(endHour, endMinute, 0, 0);

    while (currentSlotStart < dayEnd) {
      const slotEnd = new Date(
        currentSlotStart.getTime() + durationMinutes * 60000,
      );

      if (slotEnd <= dayEnd) {
        slots.push({
          professionalId,
          locationId: locationId || null,
          date: new Date(date),
          startTime: new Date(currentSlotStart),
          endTime: slotEnd,
          isBooked: false,
          isBlocked: false,
        });
      }

      currentSlotStart = new Date(
        currentSlotStart.getTime() + (durationMinutes + breakMinutes) * 60000,
      );
    }

    return slots;
  }

  async getAvailableSlots(professionalId: string, date: string) {
    const slotDate = new Date(date);

    const slots = await this.prisma.slot.findMany({
      where: {
        professionalId,
        date: slotDate,
        isBooked: false,
        isBlocked: false,
      },
      orderBy: { startTime: 'asc' },
    });

    const blockedSlots = await this.prisma.slot.count({
      where: {
        professionalId,
        date: slotDate,
        isBlocked: true,
      },
    });

    return {
      date,
      availableSlots: slots.length,
      totalSlots: slots.length + blockedSlots,
      slots,
    };
  }

  async blockSlot(dto: BlockSlotDto) {
    const slot = await this.prisma.slot.findUnique({
      where: { id: dto.slotId },
    });

    if (!slot) {
      throw new NotFoundException('Slot not found');
    }

    if (slot.isBooked) {
      throw new BadRequestException('Cannot block a booked slot');
    }

    return this.prisma.slot.update({
      where: { id: dto.slotId },
      data: {
        isBlocked: true,
        blockReason: dto.reason || 'Blocked by professional',
      },
    });
  }

  async unblockSlot(slotId: string) {
    return this.prisma.slot.update({
      where: { id: slotId },
      data: {
        isBlocked: false,
        blockReason: null,
      },
    });
  }

  async getSlotsByProfessional(
    professionalId: string,
    startDate: string,
    endDate: string,
  ) {
    return this.prisma.slot.findMany({
      where: {
        professionalId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async deleteExpiredSlots(professionalId: string) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    return this.prisma.slot.deleteMany({
      where: {
        professionalId,
        date: { lt: yesterday },
        isBooked: false,
      },
    });
  }
}
