import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface OccupationFilter {
  startDate?: string;
  endDate?: string;
  professionalId?: string;
  locationId?: string;
}

export interface OccupationMetrics {
  totalSlots: number;
  bookedSlots: number;
  occupiedPercentage: number;
  availableSlots: number;
  cancelledSlots: number;
  completedSlots: number;
  noShowSlots: number;
}

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getAgendaOccupation(filters: OccupationFilter): Promise<OccupationMetrics> {
    const where: any = {};

    if (filters.startDate && filters.endDate) {
      where.date = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      where.date = { gte: today };
    }

    if (filters.professionalId) {
      where.professionalId = filters.professionalId;
    }

    if (filters.locationId) {
      where.locationId = filters.locationId;
    }

    const slots = await this.prisma.slot.findMany({
      where,
      include: {
        appointment: {
          select: { status: true },
        },
      },
    });

    const totalSlots = slots.length;
    const bookedSlots = slots.filter((s) => s.isBooked).length;
    const cancelledSlots = slots.filter(
      (s) => s.isBooked && s.appointment?.status === 'CANCELLED',
    ).length;
    const completedSlots = slots.filter(
      (s) => s.isBooked && s.appointment?.status === 'COMPLETED',
    ).length;
    const noShowSlots = slots.filter(
      (s) => s.isBooked && s.appointment?.status === 'NO_SHOW',
    ).length;
    const availableSlots = totalSlots - bookedSlots;

    const occupiedPercentage =
      totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;

    return {
      totalSlots,
      bookedSlots,
      occupiedPercentage,
      availableSlots,
      cancelledSlots,
      completedSlots,
      noShowSlots,
    };
  }
}