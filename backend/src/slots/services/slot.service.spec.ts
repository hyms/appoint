import {
  Test,
  TestingModule,
} from '@nestjs/testing';
import { SlotService } from './slot.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProfessionalConfigService } from '../../professional-config/professional-config.service';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

describe('SlotService', () => {
  let slotService: SlotService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    slot: {
      findUnique: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    professionalConfig: {
      findFirst: jest.fn(),
    },
  };

  const mockProfessionalConfigService = {
    getConfig: jest.fn().mockResolvedValue({
      slotDurationMinutes: 30,
      breakBetweenSlotsMinutes: 5,
    }),
    getWorkingHoursForDay: jest.fn().mockResolvedValue({
      startTime: '09:00',
      endTime: '17:00',
      isActive: true,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlotService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ProfessionalConfigService,
          useValue: mockProfessionalConfigService,
        },
      ],
    }).compile();

    slotService = module.get<SlotService>(SlotService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('generateSlots', () => {
    it('should generate slots for a professional', async () => {
      const mockProfessional = {
        id: 'prof-1',
        role: 'PROFESSIONAL',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockProfessional);
      mockPrismaService.professionalConfig.findFirst.mockResolvedValue(null);
      mockPrismaService.slot.createMany.mockResolvedValue({ count: 10 });

      const dto = {
        professionalId: 'prof-1',
        startDate: '2024-01-01',
        endDate: '2024-01-02',
      };

      const result = await slotService.generateSlots(dto);

      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('message');
      expect(mockPrismaService.slot.createMany).toHaveBeenCalled();
    });

    it('should throw NotFoundException if professional not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const dto = {
        professionalId: 'non-existent',
        startDate: '2024-01-01',
        endDate: '2024-01-02',
      };

      await expect(slotService.generateSlots(dto)).rejects.toThrow();
    });

    it('should use default working hours if no config exists', async () => {
      const mockProfessional = {
        id: 'prof-1',
        role: 'PROFESSIONAL',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockProfessional);
      mockPrismaService.professionalConfig.findFirst.mockResolvedValue(null);
      mockPrismaService.slot.createMany.mockResolvedValue({ count: 16 });

      const dto = {
        professionalId: 'prof-1',
        startDate: '2024-01-01',
        endDate: '2024-01-01',
      };

      const result = await slotService.generateSlots(dto);

      expect(result.count).toBe(16);
    });
  });

  describe('getAvailableSlots', () => {
    it('should return available slots for a date', async () => {
      const mockSlots = [
        { id: 'slot-1', isBooked: false, isBlocked: false },
        { id: 'slot-2', isBooked: false, isBlocked: false },
      ];

      mockPrismaService.slot.findMany.mockResolvedValue(mockSlots);
      mockPrismaService.slot.count.mockResolvedValue(0);

      const result = await slotService.getAvailableSlots(
        'prof-1',
        '2024-01-01',
      );

      expect(result).toHaveProperty('availableSlots', 2);
      expect(result).toHaveProperty('slots');
      expect(result.slots).toHaveLength(2);
    });

    it('should count blocked slots separately', async () => {
      const mockSlots = [
        { id: 'slot-1', isBooked: false, isBlocked: false },
        { id: 'slot-2', isBooked: false, isBlocked: false },
      ];

      mockPrismaService.slot.findMany.mockResolvedValue(mockSlots);
      mockPrismaService.slot.count.mockResolvedValue(3);

      const result = await slotService.getAvailableSlots(
        'prof-1',
        '2024-01-01',
      );

      expect(result.totalSlots).toBe(5);
      expect(result.availableSlots).toBe(2);
    });
  });

  describe('blockSlot', () => {
    it('should block an available slot', async () => {
      const mockSlot = {
        id: 'slot-1',
        isBooked: false,
        isBlocked: false,
      };

      mockPrismaService.slot.findUnique.mockResolvedValue(mockSlot);
      mockPrismaService.slot.update.mockResolvedValue({
        ...mockSlot,
        isBlocked: true,
        blockReason: 'Blocked by admin',
      });

      const result = await slotService.blockSlot({
        slotId: 'slot-1',
        reason: 'Blocked by admin',
      });

      expect(result.isBlocked).toBe(true);
      expect(mockPrismaService.slot.update).toHaveBeenCalledWith({
        where: { id: 'slot-1' },
        data: {
          isBlocked: true,
          blockReason: 'Blocked by admin',
        },
      });
    });

    it('should throw BadRequestException if slot is already booked', async () => {
      const mockSlot = {
        id: 'slot-1',
        isBooked: true,
        isBlocked: false,
      };

      mockPrismaService.slot.findUnique.mockResolvedValue(mockSlot);

      await expect(
        slotService.blockSlot({ slotId: 'slot-1', reason: 'Test' }),
      ).rejects.toThrow(BadRequestException);
    });










































    it('should throw NotFoundException if slot not found for blocking', async () => {
      mockPrismaService.slot.findUnique.mockResolvedValue(null);

      await expect(
        slotService.blockSlot({ slotId: 'non-existent' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if slot not found for updating', async () => {
      mockPrismaService.slot.findUnique.mockResolvedValue(null);

      await expect(
        slotService.updateSlot('non-existent', { isBlocked: true }),
      ).rejects.toThrow(NotFoundException);
    });


    it('should throw NotFoundException if slot not found for blocking', async () => {
      mockPrismaService.slot.findUnique.mockResolvedValue(null);

      await expect(
        slotService.blockSlot({ slotId: 'non-existent' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if slot not found for updating', async () => {
      mockPrismaService.slot.findUnique.mockResolvedValue(null);

      await expect(
        slotService.updateSlot('non-existent', { isBlocked: true }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('unblockSlot', () => {
    it('should unblock a blocked slot', async () => {
      const mockSlot = {
        id: 'slot-1',
        isBlocked: true,
        blockReason: 'Temporarily blocked',
      };

      mockPrismaService.slot.update.mockResolvedValue({
        ...mockSlot,
        isBlocked: false,
        blockReason: null,
      });

      const result = await slotService.unblockSlot('slot-1');

      expect(result.isBlocked).toBe(false);
      expect(result.blockReason).toBeNull();
    });
  });

  describe('deleteExpiredSlots', () => {
    it('should delete expired unbooked slots', async () => {
      mockPrismaService.slot.deleteMany.mockResolvedValue({ count: 5 });

      const result = await slotService.deleteExpiredSlots('prof-1');

      expect(result.count).toBe(5);
      expect(mockPrismaService.slot.deleteMany).toHaveBeenCalledWith({
        where: {
          professionalId: 'prof-1',
          date: expect.any(Object),
          isBooked: false,
        },
      });
    });
  });
});
