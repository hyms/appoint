import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfessionalConfigDto } from './dto/professional-config.dto';

const defaultWorkingHours = [
  { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '17:00', isActive: true },
  {
    dayOfWeek: 'TUESDAY',
    startTime: '09:00',
    endTime: '17:00',
    isActive: true,
  },
  {
    dayOfWeek: 'WEDNESDAY',
    startTime: '09:00',
    endTime: '17:00',
    isActive: true,
  },
  {
    dayOfWeek: 'THURSDAY',
    startTime: '09:00',
    endTime: '17:00',
    isActive: true,
  },
  { dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '17:00', isActive: true },
  {
    dayOfWeek: 'SATURDAY',
    startTime: '09:00',
    endTime: '13:00',
    isActive: false,
  },
  {
    dayOfWeek: 'SUNDAY',
    startTime: '09:00',
    endTime: '13:00',
    isActive: false,
  },
];

@Injectable()
export class ProfessionalConfigService {
  constructor(private prisma: PrismaService) {}

  async getConfig(professionalId: string) {
    let config = await this.prisma.professionalConfig.findUnique({
      where: { professionalId },
      include: { location: true },
    });

    if (!config) {
      // Create default config
      config = await this.prisma.professionalConfig.create({
        data: {
          professionalId,
          workingHours: defaultWorkingHours as any,
        },
        include: { location: true },
      });
    }

    return config;
  }

  async updateConfig(professionalId: string, dto: UpdateProfessionalConfigDto) {
    const existing = await this.prisma.professionalConfig.findUnique({
      where: { professionalId },
    });

    if (existing) {
      return this.prisma.professionalConfig.update({
        where: { professionalId },
        data: {
          slotDurationMinutes: dto.slotDurationMinutes,
          breakBetweenSlotsMinutes: dto.breakBetweenSlotsMinutes,
          locationId: dto.locationId,
          workingHours: dto.workingHours
            ? (dto.workingHours as any)
            : undefined,
        },
        include: { location: true },
      });
    } else {
      return this.prisma.professionalConfig.create({
        data: {
          professionalId,
          slotDurationMinutes: dto.slotDurationMinutes,
          breakBetweenSlotsMinutes: dto.breakBetweenSlotsMinutes,
          locationId: dto.locationId,
          workingHours: (dto.workingHours || defaultWorkingHours) as any,
        },
        include: { location: true },
      });
    }
  }

  async getWorkingHoursForDay(professionalId: string, dayOfWeek: string) {
    const config = await this.getConfig(professionalId);
    const workingHours = config.workingHours as any[];
    const dayConfig = workingHours.find((wh) => wh.dayOfWeek === dayOfWeek);

    return (
      dayConfig || {
        dayOfWeek,
        startTime: '09:00',
        endTime: '17:00',
        isActive: false,
      }
    );
  }
}
